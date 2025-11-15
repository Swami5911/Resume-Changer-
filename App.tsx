
import React, { useState, useRef, useCallback } from 'react';
import { generateTailoredResumeStream } from './services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

// --- Reusable SVG Icon Components ---

const SparklesIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M10.868 2.884c.321-.772 1.305-.772 1.626 0l.404 1.018a.95.95 0 0 0 .798.653l1.108.163c.83.123 1.168.995.558 1.606l-.79 1.018a.95.95 0 0 0-.19 1.006l.405 1.018c.321.772-.284 1.687-1.093 1.343l-1.108-.493a.95.95 0 0 0-.904 0l-1.108.493c-.809.344-1.414-.571-1.093-1.343l.405-1.018a.95.95 0 0 0-.19-1.006l-.79-1.018c-.61-.611-.272-1.483.558-1.606l1.108-.163a.95.95 0 0 0 .798.653l.404-1.018ZM6.559 8.914c.321-.772 1.305-.772 1.626 0l.404 1.018a.95.95 0 0 0 .798.653l1.108.163c.83.123 1.168.995.558 1.606l-.79 1.018a.95.95 0 0 0-.19 1.006l.405 1.018c.321.772-.284 1.687-1.093 1.343l-1.108-.493a.95.95 0 0 0-.904 0l-1.108.493c-.809.344-1.414-.571-1.093-1.343l.405-1.018a.95.95 0 0 0-.19-1.006l-.79-1.018c-.61-.611-.272-1.483.558-1.606l1.108-.163a.95.95 0 0 0 .798.653l.404-1.018Z" clipRule="evenodd" />
  </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
        <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
    </svg>
);

const UploadIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
);

const PencilIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path d="M5.433 13.917l1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
    <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 1 10 6H4.75A1.25 1.25 0 0 1 3.5 4.75V15a1.25 1.25 0 0 1 1.25 1.25h10.5A1.25 1.25 0 0 1 16.5 15V10a.75.75 0 0 1 1.5 0v5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25V5.75Z" />
  </svg>
);

const EyeIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.18l.88-1.467a1.65 1.65 0 0 1 1.439-.893h12.14c.542 0 1.054.226 1.439.893l.88 1.467a1.651 1.651 0 0 1 0 1.18l-.88 1.467a1.65 1.65 0 0 1-1.439.893H2.983a1.65 1.65 0 0 1-1.44-.893l-.88-1.467Zm1.439 1.181a.15.15 0 0 0 .131.08h12.14a.15.15 0 0 0 .131-.08l.88-1.467a.151.151 0 0 0 0-.109l-.88-1.467a.15.15 0 0 0-.131-.08H2.983a.15.15 0 0 0-.131.08l-.88 1.467a.151.151 0 0 0 0 .109l.88 1.467Z" clipRule="evenodd" />
  </svg>
);


// --- UI Components ---

const TextArea: React.FC<{ id: string; label: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; rows: number, disabled?: boolean }> = ({ id, label, placeholder, value, onChange, rows, disabled = false }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <textarea
        id={id}
        rows={rows}
        className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-gray-300 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm sm:leading-6 transition disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
);

interface InputPanelProps {
  sampleResume: string;
  setSampleResume: (value: string) => void;
  jobDescription: string;
  setJobDescription: (value: string) => void;
  toolsNeeded: string;
  setToolsNeeded: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isParsingPdf: boolean;
}

const InputPanel: React.FC<InputPanelProps> = ({ sampleResume, setSampleResume, jobDescription, setJobDescription, toolsNeeded, setToolsNeeded, onGenerate, isLoading, onFileChange, isParsingPdf }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  return (
    <div className="flex flex-col space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <div className="flex justify-between items-center mb-2">
            <label htmlFor="sample-resume" className="block text-sm font-medium text-gray-300">Your Base Resume</label>
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsingPdf}
                className="flex items-center rounded-md px-2 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/10 transition disabled:opacity-50 disabled:cursor-wait"
            >
                {isParsingPdf ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Parsing...
                    </>
                ) : (
                    <>
                        <UploadIcon className="mr-1.5 w-4 h-4" />
                        Upload PDF
                    </>
                )}
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                accept="application/pdf"
                className="hidden"
            />
        </div>
        <textarea
            id="sample-resume"
            rows={10}
            className="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-gray-300 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm sm:leading-6 transition disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
            placeholder={isParsingPdf ? "Reading your PDF..." : "Paste your current resume here or upload a PDF..."}
            value={sampleResume}
            onChange={(e) => setSampleResume(e.target.value)}
            disabled={isParsingPdf}
        />
      </div>
      
      <TextArea id="job-description" label="Job Description" placeholder="Paste the target job description here..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={8} />
      <TextArea id="tools-needed" label="Additional Skills to Emphasize" placeholder="List any other tools or skills to include, e.g., React, Python, AWS..." value={toolsNeeded} onChange={(e) => setToolsNeeded(e.target.value)} rows={3} />
      
      <button
        type="button"
        onClick={onGenerate}
        disabled={isLoading || !sampleResume || !jobDescription || isParsingPdf}
        className="flex items-center justify-center rounded-md bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-70 transition-all duration-200"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : (
          <>
            <SparklesIcon className="mr-2 h-5 w-5" />
            Tailor My Resume
          </>
        )}
      </button>
    </div>
  );
};

interface ResumePreviewProps {
  resumeContent: string;
  setResumeContent: (content: string) => void;
  isLoading: boolean;
  error: string | null;
  resumeRef: React.RefObject<HTMLDivElement>;
  onDownload: () => void;
  isDownloading: boolean;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ resumeContent, setResumeContent, isLoading, error, resumeRef, onDownload, isDownloading, isEditing, setIsEditing }) => {
  
  const hasContent = resumeContent && !isLoading;

  // Custom renderer for <p> tags to handle a two-column layout
  const customP = ({ node, children, ...props }: any) => {
    const childArray = React.Children.toArray(children);
    const separator = ';;';
    
    const childWithSeparatorIndex = childArray.findIndex(
      (child: any) => typeof child === 'string' && child.includes(separator)
    );

    if (childWithSeparatorIndex !== -1) {
        const childWithSep = childArray[childWithSeparatorIndex] as string;
        const [leftOfSep, rightOfSep] = childWithSep.split(separator, 2);
        
        const leftChildren = [
            ...childArray.slice(0, childWithSeparatorIndex),
            leftOfSep.trimEnd()
        ];
        const rightChildren = [
            rightOfSep.trimStart(),
            ...childArray.slice(childWithSeparatorIndex + 1)
        ];

        return (
          <p className="entry" {...props}>
            <span className="entry-left">{leftChildren}</span>
            <span className="entry-right">{rightChildren}</span>
          </p>
        );
    }
    
    // For the contact info line specifically
    if (props.children?.toString().includes('|')) {
        return <p style={{ textAlign: 'center' }} {...props}>{children}</p>;
    }
    
    return <p {...props}>{children}</p>;
  };


  return (
    <div className="bg-gray-800 h-full p-4 md:p-6 lg:p-8 flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Preview</h2>
            {hasContent && (
                 <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={() => setIsEditing(!isEditing)}
                        className="flex items-center justify-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 transition-colors"
                    >
                        {isEditing ? (
                            <>
                                <EyeIcon className="mr-2 h-5 w-5" />
                                Preview
                            </>
                        ) : (
                            <>
                                <PencilIcon className="mr-2 h-5 w-5" />
                                Edit
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={onDownload}
                        disabled={isDownloading || isEditing}
                        className="flex items-center justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        <DownloadIcon className="mr-2 h-5 w-5" />
                        {isDownloading ? 'Saving...' : 'Download PDF'}
                    </button>
                 </div>
            )}
        </div>
        <div className="flex-grow bg-white rounded-md shadow-lg overflow-y-auto">
             {isEditing ? (
                <textarea
                    value={resumeContent}
                    onChange={(e) => setResumeContent(e.target.value)}
                    className="w-full h-full p-8 lg:p-10 resize-none border-0 focus:ring-0 text-gray-800 bg-white leading-relaxed font-serif text-sm"
                    aria-label="Resume Editor"
                />
            ) : (
              <div ref={resumeRef} className="bg-white">
                <div className="resume-container p-8 lg:p-10 text-gray-900">
                    {error ? <div className="text-red-500 font-medium bg-red-100 p-4 rounded-md">{error}</div> :
                    hasContent ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: customP }}>{resumeContent}</ReactMarkdown> :
                    <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400 mb-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-700">Your tailored resume will appear here</h3>
                        <p className="text-sm">Fill in the details on the left and click "Tailor My Resume" to get started.</p>
                    </div>
                    }
                </div>
              </div>
            )}
        </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [sampleResume, setSampleResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [toolsNeeded, setToolsNeeded] = useState('');
  const [generatedResume, setGeneratedResume] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resumePreviewRef = useRef<HTMLDivElement>(null);
  
  const handleGenerateResume = useCallback(async () => {
    if (!sampleResume || !jobDescription) {
      setError("Please provide both a base resume and a job description.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedResume('');
    setIsEditing(false); // Always reset to preview mode

    try {
        const stream = generateTailoredResumeStream(sampleResume, jobDescription, toolsNeeded);

        for await (const chunk of stream) {
            if (chunk.startsWith("Error:")) {
                setError(chunk);
                break;
            }
            setGeneratedResume(prev => prev + chunk);
        }
    } catch (e) {
        console.error("Error during resume generation stream:", e);
        setError("An unexpected error occurred while generating the resume.");
    } finally {
        setIsLoading(false);
    }
  }, [sampleResume, jobDescription, toolsNeeded]);

  const handleDownloadPdf = useCallback(async () => {
    const input = resumePreviewRef.current;
    if (!input) {
      console.error("Resume preview element not found");
      return;
    }

    setIsDownloading(true);

    try {
        const canvas = await html2canvas(input, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        const aspectRatio = canvasHeight / canvasWidth;
        const pdfImageHeight = pdfWidth * aspectRatio;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfImageHeight);
        pdf.save('AI-Tailored-Resume.pdf');
    } catch (e) {
        console.error("Failed to generate PDF:", e);
        setError("An error occurred while creating the PDF.");
    } finally {
        setIsDownloading(false);
    }
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
        setError('Please upload a valid PDF file.');
        return;
    }

    setIsParsingPdf(true);
    setError(null);
    setSampleResume('');

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const numPages = pdf.numPages;
        let fullText = '';

        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // Using a more robust type check for textContent items
            const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
            fullText += pageText + '\n\n';
        }
        setSampleResume(fullText.trim());
    } catch (e) {
        console.error('Error parsing PDF:', e);
        setError('Failed to read the PDF content. The file might be corrupted.');
    } finally {
        setIsParsingPdf(false);
        // Reset file input to allow re-uploading the same file
        if (event.target) {
            event.target.value = '';
        }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
        <header className="py-4 px-4 sm:px-6 lg:px-8 text-center border-b border-white/10">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">AI Resume Tailor</h1>
            <p className="mt-1 text-sm sm:text-base text-sky-300">Craft the perfect resume for any job description, powered by Gemini.</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-81px)]">
            <div className="bg-gray-900 overflow-y-auto">
                <InputPanel
                    sampleResume={sampleResume}
                    setSampleResume={setSampleResume}
                    jobDescription={jobDescription}
                    setJobDescription={setJobDescription}
                    toolsNeeded={toolsNeeded}
                    setToolsNeeded={setToolsNeeded}
                    onGenerate={handleGenerateResume}
                    isLoading={isLoading}
                    onFileChange={handleFileChange}
                    isParsingPdf={isParsingPdf}
                />
            </div>
            <div className="border-l border-white/10 overflow-y-auto">
                <ResumePreview
                    resumeContent={generatedResume}
                    setResumeContent={setGeneratedResume}
                    isLoading={isLoading}
                    error={error}
                    resumeRef={resumePreviewRef}
                    onDownload={handleDownloadPdf}
                    isDownloading={isDownloading}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                />
            </div>
        </main>
    </div>
  );
};

export default App;
