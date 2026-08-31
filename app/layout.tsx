import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"FinFlow — Personal Finance",description:"จัดสรรเงิน ติดตามหนี้ และเส้นทางสู่อิสรภาพทางการเงิน"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="th"><body>{children}</body></html>}
