# Jacks Unblocked Games

## Features
- **Custom Hosted Games**: Play a variety of games hosted directly on our platform.
- **Built-in Chat**: Engage with other players through our integrated chat system.
- **Full Websocket Proxy Support**: Enjoy seamless gameplay with our robust Websocket proxy.

## Installation

### Step 1: Configuration Files
1. **Root Directory `config.json`**:
   - Create a `config.json` file in the root directory using the provided example file.
   - Fill out the `admin` section with names and passwords.

2. **Greenlock Configuration**:
   - Create a `greenlock.d/config.json` file using the example provided.
   - Update the `subscriberEmail` field to receive HTTPS related emails.

### Step 2: HTML and CSS Customization
1. **Edit `html/index.html`**:
   - Modify the line that edits `title.innerText` to cycle through admin names.
   - Update the line starting with `if (message.color == "emmett") {` to include all admin names.

2. **Edit `html/index.css`**:
   - Define admin colors using the following CSS format:

     ```css
     .adminName {
         background-image: linear-gradient(to left, #color1, #color2);
         -webkit-background-clip: text;
         -moz-background-clip: text;
         background-clip: text;
         color: transparent;
     }
     ```

     Replace `.adminName`, `#color1`, and `#color2` with appropriate admin names and color values.

## Usage

After completing the installation, you can access the site and start enjoying unblocked games with enhanced features.

## Support

For any support or queries, please reach out to jacktym on discord.

---

Enjoy gaming at Jacks Unblocked Games!