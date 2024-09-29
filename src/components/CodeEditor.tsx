"use client";

import React, { useState, useEffect, useCallback, useRef, FC, useMemo, forwardRef, IframeHTMLAttributes } from "react";
import Editor, { useMonaco, loader, EditorProps, Monaco, OnMount } from "@monaco-editor/react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Play } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { TabsTrigger, TabsList, Tabs, TabsContent } from "@/components/ui/tabs";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import useMediaQuery from "@/hooks/useMediaQuery";

loader.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs" } });

const defaultCode = {
	html: `<div class="container">
  <header>
    <h1 id="title"></h1>
    <p class="tagline">Lightning-fast browser-based code editor for quick prototyping</p>
  </header>

  <section class="features">
    <div class="feature">
      <h2>Fast</h2>
      <p>Instantly load and run your code without any setup. Experience lightning-fast performance for all your coding
        needs.</p>
    </div>
    <div class="feature">
      <h2>Cross-platform</h2>
      <p>Works seamlessly on any device with a modern web browser. Code anywhere, anytime, on any platform.</p>
    </div>
    <div class="feature">
      <h2>Lightweight</h2>
      <p>No heavy installations or downloads required. Enjoy a powerful coding environment without the bloat.</p>
    </div>
  </section>

  <section class="github-link">
    <p>Check out the Github repository! <a href="https://github.com/saman-emami/codebench" target="_blank"
        rel="noopener noreferrer">https://github.com/saman-emami/codebench</a></p>
  </section>
</div>`,
	css: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  line-height: 1.6;
  height: 100vh;
  display: grid;
  place-items: center;
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

header {
  text-align: center;
  height: 120px;
  display: flex;
  flex-direction: column;
  margin-bottom: 2rem;
}

h1 {
  font-size: 3rem;
  color: hsl(var(--primary));
}

.tagline {
  font-size: 1.25rem;
  color: hsl(var(--muted-foreground));
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 5rem;
}

.feature {
  background-color: hsl(var(--card));
  padding: 2rem;
  border-radius: var(--radius);
  border: 1px solid hsl(var(--border));
}

@media(min-width: 576px) {
  .feature:last-of-type {
    grid-column-start: 1;
    grid-column-end: 3;
  }
}

.feature h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: hsl(var(--card-foreground));
}

.github-link {
  text-align: center;
}

.github-link a {
  color: hsl(var(--primary));
  text-decoration: none;
  font-weight: 500;
}

.github-link a:hover {
  text-decoration: underline;
}

.cursor {
  display: inline-block;
  width: 10px;
  height: 1.5rem;
  background-color: hsl(var(--primary));
  animation: blink 0.7s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}`,
	javascript: `document.addEventListener('DOMContentLoaded', () => {
  const title = document.getElementById('title');
  const text = "CodeBench";
  let i = 0;

  function typeWriter() {
    if (i < text.length) {
      title.innerHTML += text.charAt(i);
      i++;
      setTimeout(typeWriter, 50); 
    } else {
      title.innerHTML += ' <span class="cursor"></span>';
    }
  }

  typeWriter();

  const tagline = document.querySelector('.tagline');
  const taglineText = tagline.textContent;
  tagline.textContent = '';

  let j = 0;
  function typeTagline() {
    if (j < taglineText.length) {
      tagline.textContent += taglineText.charAt(j);
      j++;
      setTimeout(typeTagline, 40);
    }
  }

  setTimeout(typeTagline, text.length * 150);
});`,
};

type ProgrammingLanguage = "html" | "css" | "javascript";

type CodeInput = {
	[key in ProgrammingLanguage]: string;
};

type EditorRefType = Parameters<OnMount>[0];

export default function CodeEditor() {
	const [code, setCode] = useState<CodeInput>(defaultCode);
	const [codeActiveTab, setCodeActiveTab] = useState<ProgrammingLanguage>("html");
	// const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
	const isLargeScreen = useMediaQuery("(min-width: 1024px)");
	const editorRef = useRef<EditorRefType | null>(null);
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const monaco = useMonaco();

	const handleEditorDidMount = (editor: EditorRefType, monaco: Monaco) => {
		editorRef.current = editor;

		monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
			noSemanticValidation: true,
			noSyntaxValidation: false,
		});
		monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
			target: monaco.languages.typescript.ScriptTarget.Latest,
			allowNonTsExtensions: true,
		});

		updateEditorLayout();
	};

	const updateEditorLayout = () => {
		if (editorRef.current) {
			editorRef.current.layout();
		}
	};

	useEffect(() => {
		window.addEventListener("resize", updateEditorLayout);
		return () => window.removeEventListener("resize", updateEditorLayout);
	}, []);

	const handleEditorChange = (value: string | undefined) => {
		setCode((prevCode) => ({ ...prevCode, [codeActiveTab]: value || "" }));
	};

	const formatCode = useCallback(() => {
		if (editorRef.current) {
			editorRef.current?.getAction("editor.action.formatDocument")?.run();
		}
	}, []);

	useEffect(() => {
		if (editorRef.current && monaco) {
			const model = editorRef.current.getModel();
			if (model) monaco.editor.setModelLanguage(model, codeActiveTab);
		}
	}, [codeActiveTab, monaco]);

	const combinedCode = useMemo(
		() => `
    <html>
      <head>
        <style>${code.css}</style>
      </head>
      <body>
        ${code.html}
        <script>
          ${code.javascript}
        </script>
      </body>
    </html>
  `,
		[code]
	);

	useEffect(() => {
		if (iframeRef.current) {
			iframeRef.current.srcdoc = combinedCode;
		}
	}, [combinedCode]);

	return (
		<ResizablePanelGroup direction="horizontal" className="w-full">
			<ResizablePanel defaultSize={isLargeScreen ? 50 : 100} minSize={30}>
				<Tabs
					value={codeActiveTab}
					onValueChange={(value) => setCodeActiveTab(value as ProgrammingLanguage)}
					className="h-full flex flex-col"
				>
					<div className="w-full px-4 py-3 flex items-center border-b">
						<TabsList>
							<TabsTrigger value="html">HTML</TabsTrigger>
							<TabsTrigger value="css">CSS</TabsTrigger>
							<TabsTrigger value="javascript">JavaScript</TabsTrigger>
						</TabsList>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild className="ml-auto">
									<Button variant="outline" onClick={formatCode} className="p-1 size-9">
										<Sparkles className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Format Code</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
						{!isLargeScreen && (
							<Drawer>
								<DrawerTrigger asChild>
									<Button variant="default" onClick={formatCode} className="p-1 size-9 ml-2">
										<Play className="size-4" />
									</Button>
								</DrawerTrigger>
								<DrawerContent className="h-[80vh]">
									<DrawerTitle className="hidden">Previews</DrawerTitle>
									<PreviewPanel title="preview" srcDoc={combinedCode} />
								</DrawerContent>
							</Drawer>
						)}
					</div>
					<div className="flex-grow">
						<MonacoEditorWrapper
							height="100%"
							language={codeActiveTab}
							value={code[codeActiveTab]}
							onChange={handleEditorChange}
							onMount={handleEditorDidMount}
							options={{
								minimap: { enabled: false },
								fontSize: 14,
								wordWrap: "on",
								formatOnPaste: true,
								formatOnType: true,
							}}
						/>
					</div>
				</Tabs>
			</ResizablePanel>
			{isLargeScreen && (
				<>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize={50} minSize={30}>
						<PreviewPanel title="preview" srcDoc={combinedCode} />
					</ResizablePanel>
				</>
			)}
		</ResizablePanelGroup>
	);
}

const MonacoEditorWrapper: FC<EditorProps> = ({
	className,
	loading = <Loader2 className="h-5 w-5 animate-spin" />,
	...props
}) => {
	const { theme, systemTheme } = useTheme();
	const monaco = useMonaco();

	useEffect(() => {
		if (monaco) {
			monaco.editor.setTheme(
				theme === "dark" || (theme === "system" && systemTheme === "dark") ? "vs-dark" : "vs-light"
			);
		}
	}, [monaco, theme, systemTheme]);

	return <Editor className={cn(className)} loading={loading} {...props} />;
};

type PreviewPanelProps = IframeHTMLAttributes<HTMLIFrameElement>;

const PreviewPanel = forwardRef<HTMLIFrameElement, PreviewPanelProps>(({ className, ...props }, ref) => (
	<Tabs className="h-full flex flex-col" defaultValue="preview">
		<TabsContent value="preview" className="grow mt-0">
			<iframe ref={ref} className={cn("w-full h-full border-none bg-white", className)} {...props} />
		</TabsContent>
	</Tabs>
));

PreviewPanel.displayName = "PreviewPanel";
