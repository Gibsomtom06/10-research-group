from unittest.mock import patch, MagicMock
from trading_shadow.discord_reporter import DiscordReporter


def test_discord_reporter_posts_message():
    reporter = DiscordReporter("https://discord.test/webhook")
    with patch("trading_shadow.discord_reporter.requests.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=204)
        reporter.send("Test message")
        mock_post.assert_called_once()
        kwargs = mock_post.call_args.kwargs
        assert kwargs["json"]["content"] == "Test message"


def test_discord_reporter_truncates_long_message():
    reporter = DiscordReporter("https://discord.test/webhook")
    long_msg = "x" * 3000  # Discord max is 2000
    with patch("trading_shadow.discord_reporter.requests.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=204)
        reporter.send(long_msg)
        sent = mock_post.call_args.kwargs["json"]["content"]
        assert len(sent) <= 2000


def test_discord_reporter_raises_on_failure():
    import pytest
    reporter = DiscordReporter("https://discord.test/webhook")
    with patch("trading_shadow.discord_reporter.requests.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=500, text="server error")
        with pytest.raises(RuntimeError, match="Discord webhook failed"):
            reporter.send("Test")
