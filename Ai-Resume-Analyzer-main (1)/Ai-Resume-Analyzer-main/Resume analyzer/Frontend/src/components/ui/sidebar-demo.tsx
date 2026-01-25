"use client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
    LayoutDashboard,
    LogOut,
    User,
    Briefcase,
    FolderOpen,
    Code2,
    Rocket,
    Plus,
    UploadCloud
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import { LightPullThemeSwitcher } from "@/components/ui/light-pull-theme-switcher";
import { EmptyState } from "@/components/ui/interactive-empty-state";
import CardFlip from "@/components/ui/flip-card";
import BuilderPage from "@/components/ui/builder-page";
import ResumeAnalyzerPage from "@/components/ui/resume-analyzer-page";
import JobRecommendationsPage from "@/pages/JobRecommendations";
import UploadResumePage from "@/components/ui/upload-resume-page";


export function SidebarDemo() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    const links = [
        {
            label: "Dashboard",
            href: "#",
            icon: (
                <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Upload Resume",
            href: "#",
            icon: (
                <UploadCloud className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Job Recommendations",
            href: "#",
            icon: (
                <Briefcase className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
        {
            label: "Logout",
            href: "#",
            icon: (
                <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
            ),
        },
    ];
    const [open, setOpen] = useState(false);
    const [view, setView] = useState("dashboard");

    const userName = user?.user_metadata?.full_name || user?.email || "User";

    const theme = "dark";

    const handleLinkClick = async (label: string) => {
        if (label === "Dashboard") {
            setView("dashboard");
        } else if (label === "Upload Resume") {
            setView("upload-resume");
        } else if (label === "Job Recommendations") {
            setView("job-recommendations");
        } else if (label === "Logout") {
            await signOut();
            navigate("/signin");
        }
    };

    return (
        <div
            className={cn(
                "flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-950 w-full flex-1 mx-auto overflow-hidden",
                "h-screen"
            )}
        >
            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody className="justify-between gap-10">
                    <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                        <div className="flex items-center justify-between relative">
                            {open ? <Logo /> : <LogoIcon />}
                            {open && (
                                <div className="absolute right-0 -top-14 z-50 transform scale-75">
                                    <LightPullThemeSwitcher />
                                </div>
                            )}
                        </div>
                        <div className="mt-8 flex flex-col gap-2">
                            {links.map((link, idx) => (
                                <div key={idx} onClick={() => handleLinkClick(link.label)}>
                                    <SidebarLink link={link} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <SidebarLink
                            link={{
                                label: userName,
                                href: "#",
                                icon: (
                                    <User className="h-7 w-7 flex-shrink-0 rounded-full text-neutral-700 dark:text-neutral-200" />
                                ),
                            }}
                        />
                    </div>
                </SidebarBody>
            </Sidebar>
            <Dashboard theme={theme} view={view} setView={setView} />
        </div>
    );
}

export const Logo = () => {
    return (
        <a
            href="#"
            className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
        >
            <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-medium text-black dark:text-white whitespace-pre"
            >
                Resume Analyser
            </motion.span>
        </a>
    );
};

export const LogoIcon = () => {
    return (
        <a
            href="#"
            className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
        >
            <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
            <a
                href="#"
                className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
            >
            </a>
        </a>
    );
};

const Dashboard = ({ theme, view, setView }: { theme: 'light' | 'dark' | 'neutral', view: string, setView: (v: string) => void }) => {
    if (view === 'profile-analytics') {
        return (
            <div className="flex flex-1 overflow-y-auto p-2 md:p-10 rounded-tl-2xl bg-white dark:bg-neutral-950 flex-col gap-2 w-full h-full relative items-center justify-center">
                <EmptyState
                    className="w-full max-w-3xl"
                    theme={theme}
                    title="No Projects Added"
                    description="Showcase your work by adding personal projects, open-source contributions, or other achievements."
                    icons={[
                        <FolderOpen key="p1" className="h-6 w-6" />,
                        <Code2 key="p2" className="h-6 w-6" />,
                        <Rocket key="p3" className="h-6 w-6" />
                    ]}
                    action={{
                        label: "Add Project",
                        icon: <Plus className="h-4 w-4" />,
                        onClick: () => console.log("Add Project Clicked")
                    }}
                />
            </div>
        )
    }

    if (view === 'builder') {
        return (
            <div className="flex flex-1 overflow-y-auto p-2 md:p-10 rounded-tl-2xl bg-white dark:bg-neutral-950 flex-col gap-2 w-full h-full relative">
                <BuilderPage onBack={() => setView('dashboard')} />
            </div>
        )
    }

    if (view === 'resume-analyzer') {
        return (
            <div className="flex flex-1 overflow-y-auto p-2 md:p-10 rounded-tl-2xl bg-white dark:bg-neutral-950 flex-col gap-2 w-full h-full relative">
                <ResumeAnalyzerPage onBack={() => setView('dashboard')} />
            </div>
        )
    }

    if (view === 'upload-resume') {
        return (
            <div className="flex flex-1 overflow-y-auto p-2 md:p-10 rounded-tl-2xl bg-white dark:bg-neutral-950 flex-col gap-2 w-full h-full relative">
                <UploadResumePage onBack={() => setView('dashboard')} />
            </div>
        )
    }

    if (view === 'job-recommendations') {
        return (
            <div className="flex flex-1 overflow-y-auto p-2 md:p-10 rounded-tl-2xl bg-white dark:bg-neutral-950 flex-col gap-2 w-full h-full relative">
                <JobRecommendationsPage />
            </div>
        )
    }

    return (
        <div className="flex flex-1 overflow-y-auto p-2 md:p-10 rounded-tl-2xl bg-white dark:bg-neutral-950 flex-col gap-2 w-full h-full relative">
            <div className="flex flex-wrap gap-8 justify-center items-start pt-10 pb-20">
                <CardFlip
                    title="Create Resume"
                    subtitle="Build Your Future"
                    description="Build a professional, ATS-friendly resume in minutes with our AI-powered builder."
                    features={["AI Writing", "ATS Templates", "Smart Formatting", "PDF Export"]}
                    color="#ec4899"
                    onActionClick={() => setView('builder')}
                />
                <CardFlip
                    title="AI Resume Analyser"
                    subtitle="Get detailed insights"
                    description="Get detailed insights, formatting checks, and AI-powered scores for your resume to stand out."
                    features={["Score Analysis", "Formatting Check", "Keyword Matching", "ATS Optimization"]}
                    color="#3b82f6"
                    onActionClick={() => setView('resume-analyzer')}
                />
                <CardFlip
                    title="Job Recommendation"
                    subtitle="Find Your Dream Role"
                    description="Find the best job opportunities tailored specifically to your skills, experience, and preferences."
                    features={["Tailored Matches", "Skill Based", "Location Filter", "Salary Insights"]}
                    color="#8b5cf6"
                    onActionClick={() => setView('job-recommendations')}
                />

                <div onClick={() => setView('profile-analytics')} className="cursor-pointer">
                    <CardFlip
                        title="Profile Analytics"
                        subtitle="Track Performance"
                        description="Track your resume performance, skills growth, and application insights over time."
                        features={["Growth Tracking", "Skill Graphs", "Application History", "Success metrics"]}
                        color="#f59e0b"
                        onActionClick={() => setView('builder')}
                    />
                </div>


            </div>
        </div>
    );
};


