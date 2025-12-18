import os
import json
import boto3
from typing import Dict, Any, List, Optional
from langchain_aws import ChatBedrock
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents import AgentExecutor, create_tool_calling_agent
from app.models import PlayerSnapshot

class BedrockClient:
    def __init__(self):
        self.region = os.getenv("AWS_REGION", "us-east-1")
        self.role_arn = os.getenv("BEDROCK_ROLE_ARN")
        print(f"DEBUG: AWS_BEARER_TOKEN_BEDROCK present: {'AWS_BEARER_TOKEN_BEDROCK' in os.environ}")
        print(f"DEBUG: AWS_ACCESS_KEY_ID present: {'AWS_ACCESS_KEY_ID' in os.environ}")
        
        # Setup Boto3 Client
        if self.role_arn:
            sts = boto3.client('sts', region_name=self.region)
            resp = sts.assume_role(RoleArn=self.role_arn, RoleSessionName="LoLCoachSession")
            creds = resp['Credentials']
            self.boto3_client = boto3.client(
                'bedrock-runtime',
                region_name=self.region,
                aws_access_key_id=creds['AccessKeyId'],
                aws_secret_access_key=creds['SecretAccessKey'],
                aws_session_token=creds['SessionToken']
            )
        else:
            self.boto3_client = boto3.client('bedrock-runtime', region_name=self.region)

        # Model IDs
        self.CLAUDE_SONNET = "us.anthropic.claude-3-5-sonnet-20240620-v1:0" 
        self.CLAUDE_HAIKU = "us.anthropic.claude-3-5-haiku-20241022-v1:0"
        self.DEEPSEEK_R1 = "us.deepseek.r1-v1:0"

        # Initialize Coach (Claude) via LangChain
        self.coach_llm = ChatBedrock(
            client=self.boto3_client,
            model_id=self.CLAUDE_HAIKU,
            model_kwargs={"temperature": 0.7}
        )
        
        # Define Tools
        @tool
        def ask_analyst(query: str, context_json: str) -> str:
            """
            Consult the Senior Data Analyst (DeepSeek R1) for deep statistical analysis.
            Use this when you need to understand complex patterns, itemization efficiency, or specific performance metrics.
            
            Args:
                query: The specific question to ask the analyst.
                context_json: The full player stats JSON.
            """
            # Invoke DeepSeek using raw Boto3 to ensure correct payload format
            prompt = f"Context: {context_json}\n\nQuery: {query}\n\nProvide a detailed, reasoning-based analysis."
            return self._invoke_deepseek_raw(prompt)

        self.tools = [ask_analyst]

        # Create Agent
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an elite League of Legends coach. You have access to a Senior Data Analyst (DeepSeek R1) who can crunch numbers and provide deep insights. "
                       "If the user asks a question that requires statistical proof or deep analysis, use the 'ask_analyst' tool. "
                       "Otherwise, answer directly with your coaching wisdom. "
                       "Always be constructive, specific, and helpful."),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])

        self.agent = create_tool_calling_agent(self.coach_llm, self.tools, prompt)
        self.agent_executor = AgentExecutor(agent=self.agent, tools=self.tools, verbose=True)

    def _invoke_deepseek_raw(self, prompt: str) -> str:
        """Raw invocation for DeepSeek R1"""
        body = json.dumps({
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 4096,
            "temperature": 0.5
        })
        
        try:
            response = self.boto3_client.invoke_model(
                modelId=self.DEEPSEEK_R1,
                body=body,
                contentType="application/json",
                accept="application/json"
            )
            response_body = json.loads(response['body'].read())
            
            if 'choices' in response_body:
                return response_body['choices'][0]['message']['content']
            elif 'outputs' in response_body:
                return response_body['outputs'][0]['text']
            return str(response_body)
        except Exception as e:
            print(f"DeepSeek Raw Error: {e}")
            return f"Analyst unavailable: {e}"

    def generate_rating(self, snapshot: PlayerSnapshot) -> Dict[str, Any]:
        """
        Directly calls DeepSeek to get the initial rating and summary.
        """
        prompt = (
            f"Analyze these stats and output a single JSON object with: "
            f"1. 'rating' (0-100) "
            f"2. 'percentile' (float) "
            f"3. 'summary' (string): A concise 2-sentence explanation of WHY they got this rating. "
            f"Only output JSON.\n\nStats: {snapshot.model_dump_json()}"
        )
        
        content = self._invoke_deepseek_raw(prompt)
        
        try:
            # Extract JSON
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            return json.loads(content)
        except Exception as e:
            print(f"Rating Parsing Error: {e}")
            return {"rating": 50, "percentile": 50.0, "summary": "Analysis unavailable.", "error": str(e)}

    def invoke_agent(self, message: str, snapshot: PlayerSnapshot, chat_history: List[Dict] = []) -> str:
        """
        Invokes the Coach Agent (Claude) which may call the Analyst Tool (DeepSeek).
        """
        context_str = snapshot.model_dump_json()
        full_input = f"Player Context: {context_str}\n\nUser Message: {message}"
        
        result = self.agent_executor.invoke({"input": full_input})
        output = result["output"]
        
        # Handle list output (Anthropic/Bedrock format)
        if isinstance(output, list):
            text_parts = []
            for item in output:
                if isinstance(item, dict) and item.get("type") == "text":
                    text_parts.append(item.get("text", ""))
            return "".join(text_parts)
            
        return str(output)
