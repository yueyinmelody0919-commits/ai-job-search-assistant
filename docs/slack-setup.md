# Slack Bot Setup Guide

## Step 1: Create a Workspace

Go to [slack.com/create](https://slack.com/create) and create a free workspace.
Suggested name: **Job Search HQ** (or whatever you like).

## Step 2: Create 7 Bot Apps

For each bot below, go to [api.slack.com/apps](https://api.slack.com/apps):

1. Click **"Create New App"**
2. Select **"From a manifest"**
3. Choose your workspace
4. Select **JSON** tab
5. Paste the manifest below
6. Click **"Create"**
7. Go to **"Install to Workspace"** → Allow
8. Copy these two tokens:
   - **Bot Token** (`xoxb-...`): Found in **OAuth & Permissions** → Bot User OAuth Token
   - **App Token** (`xapp-...`): Found in **Basic Information** → App-Level Tokens → click "Generate Token", name it `socket`, add scope `connections:write`

Paste both tokens into your `.env` file.

---

## Bot 1: Scout (Dwight Schrute)

`.env` keys: `SLACK_SCOUT_BOT_TOKEN`, `SLACK_SCOUT_APP_TOKEN`

```json
{
  "display_information": {
    "name": "Scout (Dwight)",
    "description": "FACT: I am the best job finder. Assistant Regional Manager of your job search.",
    "background_color": "#8B4513"
  },
  "features": {
    "bot_user": {
      "display_name": "Scout (Dwight)",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "chat:write",
        "im:history",
        "im:read",
        "im:write",
        "channels:history",
        "channels:read",
        "files:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.im"
      ]
    },
    "interactivity": {
      "is_enabled": false
    },
    "org_deploy_enabled": false,
    "socket_mode_enabled": true,
    "token_rotation_enabled": false
  }
}
```

---

## Bot 2: Analyst (Oscar)

`.env` keys: `SLACK_ANALYST_BOT_TOKEN`, `SLACK_ANALYST_APP_TOKEN`

```json
{
  "display_information": {
    "name": "Analyst (Oscar)",
    "description": "Actually, the data suggests you should listen to me.",
    "background_color": "#1E3A5F"
  },
  "features": {
    "bot_user": {
      "display_name": "Analyst (Oscar)",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "chat:write",
        "im:history",
        "im:read",
        "im:write",
        "channels:history",
        "channels:read",
        "files:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.im"
      ]
    },
    "interactivity": {
      "is_enabled": false
    },
    "org_deploy_enabled": false,
    "socket_mode_enabled": true,
    "token_rotation_enabled": false
  }
}
```

---

## Bot 3: Strategist (Jim)

`.env` keys: `SLACK_STRATEGIST_BOT_TOKEN`, `SLACK_STRATEGIST_APP_TOKEN`

```json
{
  "display_information": {
    "name": "Strategist (Jim)",
    "description": "So here's what I'm thinking... *looks at camera*",
    "background_color": "#2E8B57"
  },
  "features": {
    "bot_user": {
      "display_name": "Strategist (Jim)",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "chat:write",
        "im:history",
        "im:read",
        "im:write",
        "channels:history",
        "channels:read",
        "files:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.im"
      ]
    },
    "interactivity": {
      "is_enabled": false
    },
    "org_deploy_enabled": false,
    "socket_mode_enabled": true,
    "token_rotation_enabled": false
  }
}
```

---

## Bot 4: Ops (Angela)

`.env` keys: `SLACK_OPS_BOT_TOKEN`, `SLACK_OPS_APP_TOKEN`

```json
{
  "display_information": {
    "name": "Ops (Angela)",
    "description": "Your follow-up is OVERDUE. I have organized this by priority. You're welcome.",
    "background_color": "#800020"
  },
  "features": {
    "bot_user": {
      "display_name": "Ops (Angela)",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "chat:write",
        "im:history",
        "im:read",
        "im:write",
        "channels:history",
        "channels:read",
        "files:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.im"
      ]
    },
    "interactivity": {
      "is_enabled": false
    },
    "org_deploy_enabled": false,
    "socket_mode_enabled": true,
    "token_rotation_enabled": false
  }
}
```

---

## Bot 5: Engineer (Darryl)

`.env` keys: `SLACK_ENGINEER_BOT_TOKEN`, `SLACK_ENGINEER_APP_TOKEN`

```json
{
  "display_information": {
    "name": "Engineer (Darryl)",
    "description": "Yo, I was thinking we could improve this. That's a Darryl Philbin original.",
    "background_color": "#4A4A4A"
  },
  "features": {
    "bot_user": {
      "display_name": "Engineer (Darryl)",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "chat:write",
        "im:history",
        "im:read",
        "im:write",
        "channels:history",
        "channels:read",
        "files:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.im"
      ]
    },
    "interactivity": {
      "is_enabled": false
    },
    "org_deploy_enabled": false,
    "socket_mode_enabled": true,
    "token_rotation_enabled": false
  }
}
```

---

## Bot 6: Coach (Holly)

`.env` keys: `SLACK_COACH_BOT_TOKEN`, `SLACK_COACH_APP_TOKEN`

```json
{
  "display_information": {
    "name": "Coach (Holly)",
    "description": "Ooh, that's a great growth opportunity! I put together a learning plan for you!",
    "background_color": "#DA70D6"
  },
  "features": {
    "bot_user": {
      "display_name": "Coach (Holly)",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "chat:write",
        "im:history",
        "im:read",
        "im:write",
        "channels:history",
        "channels:read",
        "files:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.im"
      ]
    },
    "interactivity": {
      "is_enabled": false
    },
    "org_deploy_enabled": false,
    "socket_mode_enabled": true,
    "token_rotation_enabled": false
  }
}
```

---

## Bot 7: QA (Stanley)

`.env` keys: `SLACK_QA_BOT_TOKEN`, `SLACK_QA_APP_TOKEN`

```json
{
  "display_information": {
    "name": "QA (Stanley)",
    "description": "Did I stutter? The bug is fixed. Can I go home now?",
    "background_color": "#696969"
  },
  "features": {
    "bot_user": {
      "display_name": "QA (Stanley)",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "chat:write",
        "im:history",
        "im:read",
        "im:write",
        "channels:history",
        "channels:read",
        "files:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.im"
      ]
    },
    "interactivity": {
      "is_enabled": false
    },
    "org_deploy_enabled": false,
    "socket_mode_enabled": true,
    "token_rotation_enabled": false
  }
}
```

---

## Step 3: Create Channels

After all bots are installed, create these channels in your workspace and invite all bots to each:

- `#job-search` — Main collaboration channel (all agents)
- `#daily-brief` — Morning briefings
- `#alerts` — Real-time notifications
- `#audit-log` — Agent activity logging

To invite a bot to a channel: type `/invite @BotName` in the channel.

## Step 4: Paste Tokens into .env

Your `.env` should have 14 Slack tokens (2 per bot):
```
SLACK_SCOUT_BOT_TOKEN=xoxb-...
SLACK_SCOUT_APP_TOKEN=xapp-...
SLACK_ANALYST_BOT_TOKEN=xoxb-...
SLACK_ANALYST_APP_TOKEN=xapp-...
... (etc for all 7)
```

Also add your workspace team ID:
```
SLACK_TEAM_ID=T0XXXXXXX
```
Find this in Slack → workspace settings, or in any bot's "Basic Information" page.
