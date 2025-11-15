
import { GoogleGenAI } from "@google/genai";

// Assume process.env.API_KEY is available in the environment
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("Gemini API key is missing. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateTailoredResumeStream = async function* (
  sampleResume: string,
  jobDescription: string,
  toolsNeeded: string
): AsyncGenerator<string, void, unknown> {
  const model = 'gemini-2.5-flash';

  const prompt = `
    You are an expert career coach and professional resume writer.

    **Primary Goal:** Rewrite the user's sample resume to be perfectly tailored for the provided job description. The output must strictly follow the structure, formatting, and style of the Resume Template below.

    **Output Format (Strict):**
    Provide the complete, tailored resume in clean Markdown.
    - Use ';;' as a separator for any line that requires a right-aligned component (like dates or locations).
    - Do not include any introductory text or any other content besides the resume itself.

    ---

    **Resume Template (Follow this structure and formatting exactly):**

    # [Full Name]
    [Address], [City], [State] [Zip Code] | [Phone Number] | [Email Address]

    ## SUMMARY
    [A concise 2-4 sentence summary tailored to the job, highlighting key qualifications and experience.]

    ## EDUCATION
    **[University Name] – [School Name, e.g., Business School]**;;[City, State]
    *[Degree, Concentration in Major]*;;[Date, e.g., May 2015]
    Cumulative GPA: [GPA] / 4.00

    **[Second University Name]**;;[City, State]
    *[Program Name]*;;[Date, e.g., Spring 2014]

    ## EXPERIENCE
    **[Company Name, Inc.]**;;[City, State]
    *[Job Title]*;;[Date Range, e.g., Summer 2014]
    *   [Use an action verb to describe an accomplishment. Quantify your impact with numbers and metrics where possible.]
    *   [Accomplishment 2]
    *   [Accomplishment 3]

    **[Previous Company Name, Inc.]**;;[City, State]
    *[Previous Job Title]*;;[Date Range, e.g., Summer 2013]
    *   [Accomplishment 1]
    *   [Accomplishment 2]

    ## LEADERSHIP & INVOLVEMENT
    **[Organization Name]**;;[Date Range, e.g., May - August 2015]
    *[Your Role, e.g., Executive Producer]*
    *   [Responsibility or accomplishment 1]
    *   [Responsibility or accomplishment 2]

    ## HONORS/AWARDS
    [Name of Scholarship or Award];;[Date, e.g., Fall 2013]
    [Second Award, if applicable]

    ## SKILLS & INTERESTS
    **Languages:** [List of languages]
    **Computer Skills:** [List of computer skills]
    **Interests:** [List of interests]

    ---

    **[JOB DESCRIPTION]**
    ${jobDescription}

    ---

    **[ADDITIONAL SKILLS TO EMPHASIZE]**
    ${toolsNeeded}

    ---

    **[USER'S BASE RESUME]**
    ${sampleResume}
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
        model: model,
        contents: prompt,
    });

    for await (const chunk of responseStream) {
        yield chunk.text;
    }

  } catch (error) {
    console.error("Error generating resume with Gemini API:", error);
    if (error instanceof Error) {
        yield `Error: Failed to generate resume. ${error.message}`;
    } else {
        yield "Error: An unknown error occurred while generating the resume.";
    }
  }
};