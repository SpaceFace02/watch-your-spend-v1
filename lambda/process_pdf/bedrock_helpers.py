import traceback

def generate_conversation_stream(bedrock_client,
                          model_id,
                          system_prompts,
                          messages):
    """
    Sends messages to a model.
    Args:
        bedrock_client: The Boto3 Bedrock runtime client.
        model_id (str): The model ID to use.
        system_prompts (JSON) : The system prompts for the model to use.
        messages (JSON) : The messages to send to the model.

    Returns:
        response (JSON): The conversation that the model generated.

    """

    # logger.info("Generating message with model %s", model_id)

    # Inference parameters to use.
    temperature = 0.5
    # top_k = 200 - Only claude supports this.

    # Base inference parameters to use.
    inference_config = {"temperature": temperature, "maxTokens": 8192}
    # Additional inference parameters to use.
    # additional_model_fields = {"top_k": top_k}

    # additionalModelRequestFields=additional_model_fields - in the request payload when using claude.
    try:
        # Send the message.
        streaming_response = bedrock_client.converse_stream(
            modelId=model_id,
            messages=messages,
            system=system_prompts,
            inferenceConfig=inference_config,
        )

        token_usage = {}
        stopReason = ""
        for chunk in streaming_response["stream"]:
            if "contentBlockDelta" in chunk:
                yield chunk["contentBlockDelta"]["delta"]["text"]
            if "metadata" in chunk:
                token_usage = chunk["metadata"]["usage"]
            if "messageStop" in chunk:
                stopReason = chunk["messageStop"]["stopReason"]
            
        # Log token usage.
        print(f"Input tokens: {token_usage['inputTokens']}", )
        print(f"Output tokens: {token_usage['outputTokens']}")
        print(f"Total tokens: {token_usage['totalTokens']}")
        print(f"Stop reason: {stopReason}")
    
    except Exception as e:
        error_message = traceback.format_exc()
        print("Error:", error_message)
        print(f"Error: {e}")