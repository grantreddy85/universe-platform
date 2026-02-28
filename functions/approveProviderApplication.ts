import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Must be admin
    const user = await base44.auth.me();
    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { application_id, action, admin_notes } = await req.json();
    if (!application_id || !action) {
      return Response.json({ error: "Missing application_id or action" }, { status: 400 });
    }

    const application = await base44.asServiceRole.entities.ProviderApplication.get(application_id);
    if (!application) {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }

    // Update application status
    await base44.asServiceRole.entities.ProviderApplication.update(application_id, {
      status: action, // "approved" or "rejected"
      admin_notes: admin_notes || "",
    });

    if (action === "approved") {
      // Parse the services and create LabService entries
      let services = [];
      try { services = JSON.parse(application.desired_services); } catch (_) {}

      let org = {};
      try { org = JSON.parse(application.qualifications); } catch (_) {}

      for (const svc of services) {
        if (!svc.service_name) continue;

        const capabilities = [];
        if (svc.subtypes) capabilities.push(...svc.subtypes.filter(Boolean));
        if (svc.machine_name) capabilities.push(`Machine: ${svc.machine_name}`);
        if (svc.software_used) capabilities.push(`Software: ${svc.software_used}`);
        if (svc.serial_number) capabilities.push(`Serial: ${svc.serial_number}`);

        await base44.asServiceRole.entities.LabService.create({
          name: svc.service_name,
          category: svc.category || "biological_cellular",
          description: svc.description || "",
          capabilities,
          turnaround_days: svc.turnaround_days ? Number(svc.turnaround_days) : null,
          price_from: svc.price_from ? Number(svc.price_from) : null,
          currency: "USD",
          status: "available",
          managed_by: application.user_email,
        });
      }

      // Notify applicant of approval
      await base44.asServiceRole.entities.Notification.create({
        user_email: application.user_email,
        title: "Provider Application Approved! 🎉",
        message: `Your application to become a UniVerse service provider has been approved. Your services are now live on the platform.`,
        type: "system",
        related_entity_type: "provider_application",
        related_entity_id: application_id,
        is_read: false,
      });
    } else {
      // Notify applicant of rejection
      await base44.asServiceRole.entities.Notification.create({
        user_email: application.user_email,
        title: "Provider Application Update",
        message: `Your service provider application has been reviewed. ${admin_notes ? "Notes: " + admin_notes : "Please contact us for more information."}`,
        type: "system",
        related_entity_type: "provider_application",
        related_entity_id: application_id,
        is_read: false,
      });
    }

    return Response.json({ success: true, action });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});