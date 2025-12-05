# AWS Bedrock Icon for @rancher/icons

This directory contains the AWS Bedrock icon SVG that should be added to the [@rancher/icons](https://github.com/rancher/icons) package.

## Icon File

- `bedrock.svg` - The AWS Bedrock icon representing the foundation/layers concept of the Bedrock AI service

## Integration Steps

To add this icon to the @rancher/icons package:

1. Copy `bedrock.svg` to the `svg/` folder in the [rancher/icons](https://github.com/rancher/icons) repository
2. Update the version number in `package.json`
3. Update `CHANGELOG.md` to include the new version and the added icon:
   ```
   | 2.0.54  | Added bedrock icon <img src="./svg/bedrock.svg"/>  |
   ```
4. Commit and push the changes
5. The GitHub Action will automatically build and publish the new icon font to NPM

## Usage

Once published, the icon can be used in the Rancher Dashboard as:

```html
<i class="icon icon-bedrock"></i>
```

## Related

- Issue: https://github.com/rancher/dashboard/issues/16089
- Related PR: rancher-sandbox/rancher-ai-ui#95 (Amazon Bedrock support for AI agent config)
