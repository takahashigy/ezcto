import re

with open('server/_core/claude.ts', 'r') as f:
    content = f.read()

# Find and replace the JSON schema section
# Look for the pattern starting from "Please provide your analysis" to "Remember:"
pattern = r'(Please provide your analysis in the following JSON format:\n\{[\s\S]*?)"paydexBannerPrompt":[^\}]*\}\n\nRemember:'

# Build the complete schema with correct field names
replacement = r'''\1"paydexBannerPrompt": "Detailed prompt for 1500x500 PayDex banner",
  "xBannerPrompt": "Detailed prompt for 1200x480 X/Twitter banner",
  "logoPrompt": "Detailed prompt for 512x512 logo",
  "heroBackgroundPrompt": "Detailed prompt for 1920x1080 hero background",
  "featureIconPrompts": [
    "Detailed prompt for 256x256 feature icon 1",
    "Detailed prompt for 256x256 feature icon 2",
    "Detailed prompt for 256x256 feature icon 3"
  ],
  "communityScenePrompt": "Detailed prompt for 800x600 community scene",
  "websiteContent": {
    "headline": "Catchy headline",
    "tagline": "Memorable tagline",
    "about": "Project description (2-3 sentences)",
    "features": [
      "Feature 1 description",
      "Feature 2 description",
      "Feature 3 description"
    ],
    "tokenomics": {
      "totalSupply": "Total supply info",
      "distribution": "Distribution details"
    }
  }
}

Remember:'''

new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE)

if new_content == content:
    print("❌ Pattern not found! Let me check the file...")
    # Print a snippet to debug
    start_idx = content.find('Please provide your analysis')
    if start_idx != -1:
        print("Found 'Please provide your analysis' at position", start_idx)
        print("Content around it:")
        print(content[start_idx:start_idx+500])
else:
    with open('server/_core/claude.ts', 'w') as f:
        f.write(new_content)
    print("✅ Fixed JSON schema with correct field names")
