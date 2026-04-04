import anthropic
from tools import (
    get_stock_price,
    get_crypto_price,
    get_stock_history,
    get_crypto_history,
    compare_assets,
    get_market_summary,
    get_top_movers,
    calculate_portfolio_value,
    TOOLS_SCHEMA,
)
import json

SYSTEM_PROMPT = """You are a professional financial market analyst AI agent. You have access to real-time stock and cryptocurrency market data tools.

Your personality:
- Direct, data-driven, and concise
- Always back statements with actual numbers from your tools
- Never give financial advice — always end with a disclaimer
- When asked about a price, ALWAYS call the appropriate tool first before answering
- When comparing assets, call compare_assets tool
- For market overviews, call get_market_summary first

Rules:
- Always use tools to get current data. Never guess or make up prices.
- Format numbers cleanly: prices with 2 decimal places, percentages with 2 decimal places
- Use 🟢 for positive changes, 🔴 for negative changes
- End every response with: ⚠️ This is not financial advice."""

TOOL_DISPATCH = {
    "get_stock_price": get_stock_price,
    "get_crypto_price": get_crypto_price,
    "get_stock_history": get_stock_history,
    "get_crypto_history": get_crypto_history,
    "compare_assets": compare_assets,
    "get_market_summary": get_market_summary,
    "get_top_movers": get_top_movers,
    "calculate_portfolio_value": calculate_portfolio_value,
}


class MarketAgent:
    def __init__(self):
        self.client = anthropic.Anthropic()
        self.model = "claude-sonnet-4-5"
        self.conversation_history = []

    def chat(self, user_message: str) -> str:
        self.conversation_history.append({
            "role": "user",
            "content": user_message,
        })

        max_iterations = 10
        iteration = 0

        while iteration < max_iterations:
            iteration += 1
            try:
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=4096,
                    system=SYSTEM_PROMPT,
                    tools=TOOLS_SCHEMA,
                    messages=self.conversation_history,
                )
            except Exception as e:
                return f"Error communicating with AI: {str(e)}"

            if response.stop_reason == "end_turn":
                final_text = ""
                for block in response.content:
                    if hasattr(block, "text"):
                        final_text += block.text
                self.conversation_history.append({
                    "role": "assistant",
                    "content": response.content,
                })
                return final_text

            elif response.stop_reason == "tool_use":
                self.conversation_history.append({
                    "role": "assistant",
                    "content": response.content,
                })

                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        tool_name = block.name
                        tool_input = block.input
                        tool_use_id = block.id

                        func = TOOL_DISPATCH.get(tool_name)
                        if func is None:
                            result = {"error": f"Unknown tool: {tool_name}"}
                        else:
                            try:
                                result = func(**tool_input)
                            except Exception as e:
                                result = {"error": f"Tool '{tool_name}' failed: {str(e)}"}

                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_use_id,
                            "content": json.dumps(result),
                        })

                self.conversation_history.append({
                    "role": "user",
                    "content": tool_results,
                })

            else:
                final_text = ""
                for block in response.content:
                    if hasattr(block, "text"):
                        final_text += block.text
                if final_text:
                    return final_text
                return "Unexpected stop reason: " + str(response.stop_reason)

        return "Agent reached maximum iterations without completing. Please try again."

    def reset_conversation(self):
        self.conversation_history = []
