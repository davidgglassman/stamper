import { select, input } from "@inquirer/prompts";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import nunjucks from "nunjucks";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, "../../output");

const copyAndRenderTemplate = async (templateDir, outputDir, data) => {
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });
  // Read all items in template directory
  const items = await fs.readdir(templateDir, { withFileTypes: true });
  for (const item of items) {
    const sourcePath = path.join(templateDir, item.name);
    const targetPath = path.join(outputDir, item.name);
    if (item.isDirectory()) {
      // Recursively process subdirectories
      await copyAndRenderTemplate(sourcePath, targetPath, data);
    } else if (item.isFile()) {
      if (item.name.endsWith(".njk")) {
        // Render template file
        const renderedContent = nunjucks.render(sourcePath, data);
        // Remove .njk extension for output file
        const outputFileName = item.name.slice(0, -4);
        const outputFilePath = path.join(outputDir, outputFileName);
        await fs.writeFile(outputFilePath, renderedContent, "utf8");
      } else {
        // Copy non-template files as-is
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  }
};

export const scaffoldProject = async (templateName, outputDir, data = {}) => {
  const templatePath = path.join(__dirname, "../../templates", templateName);
  const projectOutputDir = path.join(outputDir, templateName);

  try {
    // Check if template directory exists
    await fs.access(templatePath);

    // Remove existing project directory if it exists
    try {
      await fs.rm(projectOutputDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }

    // Process the entire template directory
    await copyAndRenderTemplate(templatePath, projectOutputDir, data);
    console.log(`Project scaffolded successfully to: ${projectOutputDir}`);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error(`Template directory not found: ${templatePath}`);
    } else {
      console.error(`Error scaffolding project: ${error.message}`);
    }
  }
};

export const runNunjucksTest = async () => {
  const templateName = await select({
    message: "Select a template",
    choices: [
      {
        name: "React",
        value: "react",
      },
      {
        name: "SvelteKit",
        value: "sveltekit",
      },
      {
        name: "Something else",
        value: "other",
      },
    ],
  });
  const project_name = await input({ message: "What's your project name?" });
  const project_version = await input({
    message: "What's your project version?",
  });
  const thing_name = await input({
    message: "Name a random thing: ",
  });
  await scaffoldProject(templateName, outputPath, {
    project_name,
    project_version,
    thing_name,
  });
};
