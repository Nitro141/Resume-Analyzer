"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Search, UploadCloud, FileText, ExternalLink, Loader2, AlertCircle, Building } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

interface Job {
    job_title: string;
    company: string;
    location: string;
    match_percentage: number;
    missing_skills: string[];
    apply_url: string;
    source: string;
    description: string;
}

export default function JobRecommendationsPage() {
    const { session } = useAuth();
    const [loading, setLoading] = useState(false);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [location, setLocation] = useState("India");
    const [resumeSource, setResumeSource] = useState<'profile' | 'upload'>('profile');
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setResumeSource('upload');
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        setError(null);
        setJobs([]);

        try {
            const formData = new FormData();
            formData.append("location", location);
            formData.append("use_profile", (resumeSource === 'profile').toString());
            if (resumeSource === 'upload' && file) {
                formData.append("file", file);
            }

            const token = session?.access_token;
            if (!token) throw new Error("Not authenticated");

            const response = await fetch("http://localhost:8000/jobs/recommend", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Failed to fetch jobs");
            }

            const data = await response.json();
            setJobs(data.recommended_jobs);

        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-neutral-950 p-6 overflow-y-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Briefcase className="h-8 w-8 text-indigo-600" />
                        Job Recommendations
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Live opportunities matched to your resume using ATS logic.
                    </p>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-semibold self-start md:self-center border border-green-200 dark:border-green-800">
                    Powered by Adzuna
                </div>
            </div>

            {/* Resume Source & Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Resume Source Card */}
                <Card className="lg:col-span-1 border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Resume Source</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-4">
                            <div
                                className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all ${resumeSource === 'profile' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900'}`}
                                onClick={() => setResumeSource('profile')}
                            >
                                <div className="flex items-center gap-2 font-medium text-sm mb-1">
                                    <FileText className="h-4 w-4" /> Profile Resume
                                </div>
                                <div className="text-xs text-neutral-500">Use your saved profile resume</div>
                            </div>

                            <div
                                className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all relative overflow-hidden ${resumeSource === 'upload' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900'}`}
                                onClick={() => document.getElementById('resume-upload')?.click()}
                            >
                                <input
                                    id="resume-upload"
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <div className="flex items-center gap-2 font-medium text-sm mb-1">
                                    <UploadCloud className="h-4 w-4" /> Upload New
                                </div>
                                <div className="text-xs text-neutral-500 truncate">
                                    {file ? file.name : "Select PDF file"}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Filters & Action */}
                <Card className="lg:col-span-2 border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-center">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full space-y-2">
                                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        placeholder="e.g. Bangalore, Remote, India"
                                        className="pl-9 w-full h-10 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleSearch}
                                disabled={loading}
                                className="w-full md:w-auto min-w-[150px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
                            >
                                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...</> : "Find Matching Jobs"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-400"
                >
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    {error}
                </motion.div>
            )}

            {/* Results Grid */}
            {jobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map((job, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="h-full hover:shadow-md transition-shadow dark:border-neutral-800 flex flex-col">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <CardTitle className="text-lg leading-tight mb-1 text-indigo-700 dark:text-indigo-400">
                                                {job.job_title}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-1">
                                                <Building className="h-3 w-3" /> {job.company}
                                            </CardDescription>
                                        </div>
                                        <div className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                            {job.location}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col gap-4">
                                    {/* Match Score */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span>ATS Match Score</span>
                                            <span className={job.match_percentage > 70 ? "text-green-600" : "text-amber-600"}>{job.match_percentage}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${job.match_percentage > 75 ? 'bg-green-500' : job.match_percentage > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                style={{ width: `${job.match_percentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Description Snippet */}
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-3">
                                        {job.description ? job.description.replace(/<[^>]*>?/gm, "") : "No description available"}
                                    </p>

                                    {/* Missing Skills */}
                                    {job.missing_skills.length > 0 && (
                                        <div className="mt-auto pt-2">
                                            <p className="text-xs font-medium text-neutral-500 mb-2">Missing Skills:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {job.missing_skills.map((skill, i) => (
                                                    <span key={i} className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] border border-red-100 dark:border-red-900/30">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full mt-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                                        asChild
                                    >
                                        <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                                            View & Apply <ExternalLink className="ml-2 h-3 w-3" />
                                        </a>
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                !loading && (
                    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border-dashed border-2 border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-white/5">
                        <Search className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mb-4" />
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-200">No jobs found yet</h3>
                        <p className="text-neutral-500 max-w-sm">
                            Adjust your filters or upload a resume to see matched job recommendations based on your skills.
                        </p>
                    </div>
                )
            )}

            <div className="mt-12 text-center text-xs text-neutral-400">
                Job listings provided by Adzuna. Apply on employer’s website.
            </div>
        </div>
    );
}
