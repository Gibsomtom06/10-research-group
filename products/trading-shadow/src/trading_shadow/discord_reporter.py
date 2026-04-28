import requests


class DiscordReporter:
    MAX_LEN = 2000  # Discord content limit

    def __init__(self, webhook_url: str):
        if not webhook_url:
            raise ValueError("Discord webhook URL required")
        self.webhook_url = webhook_url

    def send(self, content: str) -> None:
        if len(content) > self.MAX_LEN:
            content = content[: self.MAX_LEN - 3] + "..."
        resp = requests.post(self.webhook_url, json={"content": content}, timeout=10)
        if resp.status_code not in (200, 204):
            raise RuntimeError(f"Discord webhook failed: {resp.status_code} {resp.text}")
