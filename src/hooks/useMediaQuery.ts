import { useEffect, useState } from "react";

export default function useMediaQuery(mediaQuery: string): boolean {
	const [matches, setMatches] = useState<boolean>(false);

	useEffect(() => {
		const mediaQueryList = window.matchMedia(mediaQuery);

		const handleChange = (event: MediaQueryListEvent) => {
			setMatches(event.matches);
		};

		setMatches(mediaQueryList.matches);

		mediaQueryList.addEventListener("change", handleChange);

		return () => {
			mediaQueryList.removeEventListener("change", handleChange);
		};
	}, [mediaQuery]);

	return matches;
}
