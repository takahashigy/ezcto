import { storagePut } from "./storage";
import * as db from "./db";

/**
 * 部署项目到S3+CDN
 */
export interface DeploymentInput {
  projectId: number;
  userId: number;
}

export interface DeploymentOutput {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * 生成项目的子域名
 */
function generateSubdomain(projectName: string, projectId: number): string {
  // 清理项目名称，只保留字母数字和连字符
  const cleanName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
  
  // 添加项目ID确保唯一性
  return `${cleanName}-${projectId}`;
}

/**
 * 部署网站到S3
 */
export async function deployWebsite(input: DeploymentInput): Promise<DeploymentOutput> {
  try {
    // 获取项目信息
    const project = await db.getProjectById(input.projectId);
    if (!project) {
      return { success: false, error: "Project not found" };
    }

    if (project.userId !== input.userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (project.status !== "completed") {
      return { success: false, error: "Project generation not completed" };
    }

    // 获取网站HTML资产
    const assets = await db.getAssetsByProjectId(input.projectId);
    const websiteAsset = assets.find(a => a.assetType === "website");
    
    if (!websiteAsset || !websiteAsset.textContent) {
      return { success: false, error: "Website HTML not found" };
    }

    // 生成子域名
    const subdomain = generateSubdomain(project.name, project.id);
    const fileKey = `deployments/${subdomain}/index.html`;

    // 上传到S3
    const { url } = await storagePut(
      fileKey,
      websiteAsset.textContent,
      "text/html"
    );

    // 更新项目部署状态
    await db.updateProject(input.projectId, {
      deploymentUrl: url,
      deploymentStatus: "deployed",
    });

    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error("[Deployment] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
