import re

# Read the file
with open('server/_core/claude.ts', 'r') as f:
    content = f.read()

# Find the line with paydexBannerPrompt and replace the entire JSON schema section
# The schema starts after "Please provide your analysis in the following JSON format:\n{\n"
# and ends before "\n}\n\nRemember:"

pattern = r'(Please provide your analysis in the following JSON format:\n\{[\s\S]*?)"paydexBannerPrompt":.*?"\n\}\n\nRemember:'

replacement = r'''\1"paydexBannerPrompt": "Detailed prompt for 1500x500 PayDex banner",
  "xBannerPrompt": "Detailed prompt for 1200x480 X/Twitter banner",
  "logoPrompt": "Detailed prompt for 512x512 logo",
  "heroBackgroundPrompt": "Detailed prompt for 1920x1080 hero background",
  "featureIconPrompts": ["icon1 prompt", "icon2 prompt", "icon3 prompt"],
  "communityScenePrompt": "Detailed prompt for 800x600 community scene",
  "websiteContent": {
    "headline": "Catchy headline",
    "tagline": "Memorable tagline",
    "about": "Project description",
    "features": ["Feature 1", "Feature 2", "Feature 3"],
    "tokenomics": {
      "totalSupply": "Total supply",
      "distribution": "Distribution"
    }
  }
}

Remember:'''

new_content = re.sub(pattern, replacement, content)

# Write back
with open('server/_core/claude.ts', 'w') as f:
    f.write(new_content)

print("✅ Fixed JSON schema in claude.ts")
