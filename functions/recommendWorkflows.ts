import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, data, related_entity_type, related_entity_id, project_id } = await req.json();

    // Analyze the data context
    let analysisPrompt = '';
    if (related_entity_type === 'document' && data) {
      analysisPrompt = `Analyze this research document and recommend relevant workflow types.
Document Title: ${data.title}
File Type: ${data.file_type}
Summary: ${data.summary || 'No summary provided'}
Tags: ${data.tags ? data.tags.join(', ') : 'No tags'}
Methodology: ${data.methodology || 'Not specified'}

Based on this document, which of these workflow types would be most beneficial?
- in_silico_simulation: For computational modeling and simulations
- meta_analysis: For synthesizing and analyzing multiple studies
- comparative_modelling: For comparing different models or approaches
- statistical_analysis: For statistical analysis of data
- other: General purpose workflows

Return a JSON object with "recommended_workflows" (array of 1-3 workflow types) and "reasoning" (brief explanation).`;
    } else if (related_entity_type === 'lab_request') {
      analysisPrompt = `A lab request has completed and results are ready. Recommend workflow types to process lab results.
Request Type: ${data.request_type || 'Unknown'}
Lab Service: ${data.service_id ? 'Lab analysis service' : 'Unknown'}
Description: ${data.description || 'No description'}

Which workflow types would help analyze these lab results?
- in_silico_simulation: For modeling the results
- meta_analysis: For comparing with other studies
- comparative_modelling: For modeling comparisons
- statistical_analysis: For statistical analysis of results
- other: General purpose

Return a JSON object with "recommended_workflows" (array of 1-3 workflow types) and "reasoning" (brief explanation).`;
    }

    if (!analysisPrompt) {
      return Response.json({ error: 'Unable to analyze data type' }, { status: 400 });
    }

    // Use LLM to recommend workflows
    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          recommended_workflows: {
            type: 'array',
            items: { type: 'string' }
          },
          reasoning: { type: 'string' }
        }
      }
    });

    const recommendations = analysisResult.recommended_workflows || [];
    
    if (recommendations.length === 0) {
      return Response.json({ success: true, notifications_created: 0 });
    }

    // Create notification with recommendations
    const workflowList = recommendations.map(w => {
      const names = {
        in_silico_simulation: 'In-silico Simulation',
        meta_analysis: 'Meta-analysis',
        comparative_modelling: 'Comparative Modelling',
        statistical_analysis: 'Statistical Analysis',
        other: 'Other'
      };
      return names[w] || w;
    }).join(', ');

    await base44.asServiceRole.entities.Notification.create({
      user_email: user.email,
      title: 'Recommended Workflows',
      message: `Based on your uploaded data, we recommend these workflows: ${workflowList}. ${analysisResult.reasoning}`,
      type: 'validation_update',
      related_entity_type,
      related_entity_id,
      is_read: false
    });

    // Store recommendations for later reference
    await base44.asServiceRole.entities.WorkflowRecommendation.create({
      project_id,
      user_email: user.email,
      related_entity_type,
      related_entity_id,
      recommended_workflows: recommendations,
      reasoning: analysisResult.reasoning,
      created_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      recommendations,
      reasoning: analysisResult.reasoning
    });

  } catch (error) {
    console.error('Workflow recommendation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});