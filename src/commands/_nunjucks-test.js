import { input } from '@inquirer/prompts';
import path from "path";
import { fileURLToPath } from "url";
import nunjucks from "nunjucks";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const renderTemplate = (answers) => {
  let templatePath = path.join(
    __dirname,
    "../../templates/react/package.json.njk"
  );

  let template = nunjucks.render(templatePath, {
    project_name: answers.project_name,
    project_version: answers.project_version,
  });
  console.log(template);
};

export const runNunjucksTest = async () => {
  let project_name = await input({ message: "What's your project name?" });
	let project_version = await input({ message: "What's your project version?" });

	renderTemplate({ project_name, project_version})
};
