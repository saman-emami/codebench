import CodeEditor from "@/components/CodeEditor";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Code2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
	return (
		<div>
			<main>
				<div className="h-screen flex flex-col bg-background">
					<div className="flex justify-between items-center h-14 p-4 border-b">
						<h1 className="text-xl font-bold text-card-foreground flex items-center gap-2 select-none">
							<Code2 />
							CodeBench
						</h1>
						<ModeToggle />
					</div>
					<div className="flex-grow flex w-full">
						<CodeEditor />
					</div>
				</div>
				<div className="absolute bottom-5 right-5 border py-4 px-4 bg-primary-foreground shadow rounded-md text-sm">
					<p className="font-semibold">Check out the Github repository!</p>
					<Link className="text-blue-500" href="https://github.com/saman-emami/codebench">
						https://github.com/saman-emami/codebench
					</Link>
				</div>
			</main>
		</div>
	);
}
