import { useEffect, useState } from "react";
import api from "../lib/api";
import { Link } from "react-router-dom";
import UnifiedInputBox from "../components/UnifiedInputBox";

export default function GeneratePage() {
    // const navigate = useNavigate();
    const [issueKey, setIssueKey] = useState('');
    const [prelight, setPrelight] = useState<any | null>(null);
    const [genResult, setGenResult] = useState<any | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [generating, setGenerating] = useState(false);
    // const [showExistingModal, setShowExistingModal] = useState(false);

    useEffect(() => {
        setPrelight(null);
        // setGenResult(null);
        // setShowExistingModal(false);
    }, [issueKey]);

    async function analyze(imageSessionId?: string) {
        if (!issueKey.trim()) return;
        setAnalyzing(true);
        setPrelight(null);
        try {
            const payload: any = { issueKey: issueKey.trim() };
            if (imageSessionId) {
                payload.imageSessionId = imageSessionId;
            }
            const res = await api.post('/generations/prelight', payload);
            setPrelight(res.data);
        } catch (err: any) {
            setPrelight({ error: err?.response?.data?.error || 'Analysis failed' });
        } finally {
            setAnalyzing(false);
        }
    }

    async function performGeneration(imageSessionId?: string) {
        if (!issueKey.trim()) return;
        setGenerating(true);
        setGenResult(null);
        try {
            const payload: any = { issueKey: issueKey.trim() };
            if (imageSessionId) {
                payload.imageSessionId = imageSessionId;
            }
            const res = await api.post('/generations/testcases', payload);
            setGenResult(res.data.data)
        } catch (err: any) {
            setGenResult({ error: err?.response?.data?.error || 'Generation failed' });
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Heading and the sub heading */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Generate Test Cases</h1>
                <p className="mt-2 text-gray-600">Enter a JIRA issue key and optionally add images to generate comprehensive test cases</p>
            </div>

            {/* Unified Input Box with Image Upload */}
            <UnifiedInputBox
                value={issueKey}
                onChange={setIssueKey}
                onAnalyze={analyze}
                onGenerate={performGeneration}
                analyzing={analyzing}
                generating={generating}
            />

            {/** Prelight ressult */}
            {prelight && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis Results</h2>
                    {prelight.error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {prelight.error}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Issue Key</span>
                                    <p className="text-lg font-semibold text-gray-900">{prelight.issueKey}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Title</span>
                                    <p className="text-gray-900">{prelight.title}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">UI Story</span>
                                    <p className={`font-semibold ${prelight.isUiStory ? 'text-green-600' : 'text-gray-600'}`}>
                                        {prelight.isUiStory ? 'Yes' : 'No'}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Attachments</span>
                                    <p className="text-gray-900">{prelight.attachments || 0}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Estimated Tokens</span>
                                    <p className="text-gray-900">{prelight.estimatedTokens || 0}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Estimated Cost</span>
                                    <p className="text-gray-900">${typeof prelight.estimatedCost === 'string' ? prelight.estimatedCost : (Number(prelight.estimatedCost) || 0).toFixed(4)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/** Generation result */}
            {genResult && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Generation Complete</h2>
                    {genResult.error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {genResult.error}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Issue Key</span>
                                    <p className="text-lg font-semibold text-gray-900">{genResult.issueKey}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-medium text-gray-500">Generation Time</span>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {typeof genResult.generationTimeSeconds === 'string'
                                            ? `${genResult.generationTimeSeconds}s`
                                            : `${(Number(genResult.generationTimeSeconds) || 0).toFixed(1)}s`}
                                    </p>
                                </div>
                            </div>
                            {genResult.markdown && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-sm text-green-800">
                                        ✅ Test cases generated successfully! <Link to={`/view/${genResult.generationId}`} className="font-semibold underline hover:text-green-900">View Test Cases</Link>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}