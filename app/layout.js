import "../styles/globals.css";
import Navbar from "@/components/Navbar";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

export const metadata = { title: "Mini Library", description: "Library Management System" };

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body>
				<SessionProviderWrapper>
					<Navbar />
					{children}
				</SessionProviderWrapper>
			</body>
		</html>
	);
}
