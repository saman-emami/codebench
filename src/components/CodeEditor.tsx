"use client";

import React, { useState, useEffect, useCallback, useRef, FC } from "react";
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
	html: '<div id="app">\n  <h1>Hello World!</h1>\n  <p>Start editing to see some magic happen!</p>\n</div>',
	css: "body {\n  font-family: sans-serif;\n  padding: 20px;\n}\n\nh1 {\n  color: #333;\n}",
	javascript: 'console.log("Welcome to CodePen Clone!");\n\n// Try editing this code and check the console tab!',
};

type ProgrammingLanguage = "html" | "css" | "javascript";

type CodeInput = {
	[key in ProgrammingLanguage]: string;
};

type EditorRefType = Parameters<OnMount>[0];

export default function CodeEditor() {
	const [code, setCode] = useState<CodeInput>(defaultCode);
	const [codeActiveTab, setCodeActiveTab] = useState<ProgrammingLanguage>("html");
	const [consoleOutput, setConsoleOutput] = useState<string[]>([]); //
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

	const combinedCode = `
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
  `;

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.data.type === "console") {
				setConsoleOutput((prev) => [...prev, `${event.data.method}: ${event.data.args.join(" ")}`]);
			}
		};

		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, []);

	useEffect(() => {
		if (iframeRef.current) {
			iframeRef.current.srcdoc = combinedCode;
		}
	}, [combinedCode]);

	const PreviewPanel = () => (
		<Tabs className="h-full flex flex-col" defaultValue="preview">
			{/* 			<div className="w-full px-4 py-3 flex items-center border-b justify-center lg:justify-start">
				<TabsList>
					<TabsTrigger value="preview">Preview</TabsTrigger>
					<TabsTrigger value="console">Console</TabsTrigger>
				</TabsList>
			</div> */}

			<TabsContent value="preview" className="grow mt-0">
				<iframe ref={iframeRef} title="preview" srcDoc={combinedCode} className="w-full h-full border-none bg-white" />
			</TabsContent>

			{/* 			<TabsContent value="console" className="grow mt-0">
				<div className="w-full h-full p-4 bg-background text-foreground font-mono text-sm overflow-auto">
					{consoleOutput.map((output, index) => (
						<div className="text-foreground" key={index}>
							{output}
						</div>
					))}
				</div>
			</TabsContent> */}
		</Tabs>
	);

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
								<DrawerContent className="h-[90vh]">
									<DrawerTitle className="hidden">Previes</DrawerTitle>
									<PreviewPanel />
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
						<PreviewPanel />
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
