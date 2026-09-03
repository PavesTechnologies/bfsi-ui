import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../FormElements/Button';
import apiClient from '../../api/client';
import '../../styles/applicationJourney.css';

// ─── Document Configuration ────────────────────────────────────────────────
const DOC_CONFIG = {
    mandatory: [
        { id: 'pan_card', label: 'PAN Card', endpoint: '/documents/upload/pan' },
    ],
    proofTypes: [
        {
            id: 'address_proof',
            label: 'Address Proof',
            description: 'Select and upload one address proof document',
            options: [
                { id: 'aadhaar',      label: 'Aadhaar Card',               endpoint: '/documents/upload/aadhaar' },
                { id: 'voter_id',     label: 'Voter ID',                    endpoint: '/documents/upload/voter-id' },
                { id: 'passport',     label: 'Passport',                    endpoint: '/documents/upload/passport' },
                { id: 'utility_bill', label: 'Utility Bill',                endpoint: '/documents/upload/utility-bill' },
            ],
        },
        {
            id: 'income_proof',
            label: 'Income Proof',
            description: 'Select and upload one income proof document',
            options: [
                { id: 'salary_slips',    label: 'Salary Slips (Last 3 months)',    endpoint: '/documents/upload/salary-slip' },
                { id: 'form_16',         label: 'Form 16',                         endpoint: '/documents/upload/form-16' },
                { id: 'itr',             label: 'ITR (Last 2 years)',               endpoint: '/documents/upload/itr' },
                { id: 'bank_statements', label: 'Bank Statements (Last 6 months)', endpoint: '/documents/upload/bank-statement' },
            ],
        },
    ],
};

// Maps doc_type returned by the ZIP endpoint → our frontend doc id
const DOC_TYPE_MAP = {
    pan_card:      'pan_card',
    aadhaar_card:  'aadhaar',
    voter_id:      'voter_id',
    voter_card:    'voter_id',
    passport:      'passport',
    utility_bill:  'utility_bill',
    salary_slip:   'salary_slips',
    salary_slips:  'salary_slips',
    form_16:       'form_16',
    itr:           'itr',
    bank_statement:  'bank_statements',
    bank_statements: 'bank_statements',
};

// Left-column list: the mandatory PAN upload plus the two "pick one of N"
// proof groups, unified so the list and status logic can treat them the same.
const GROUPS = [
    { kind: 'single', required: true, id: DOC_CONFIG.mandatory[0].id, label: DOC_CONFIG.mandatory[0].label, endpoint: DOC_CONFIG.mandatory[0].endpoint },
    { kind: 'choice', required: true, ...DOC_CONFIG.proofTypes[0] },
    { kind: 'choice', required: true, ...DOC_CONFIG.proofTypes[1] },
];

const STATUS_LABEL = {
    idle: 'Not uploaded',
    uploading: 'Uploading…',
    success: 'Uploaded',
    error: 'Upload failed',
};

function groupStatus(group, { uploading, uploadStatus, selectedProofOptions }) {
    const docId = group.kind === 'single' ? group.id : selectedProofOptions[group.id];
    if (!docId) return 'idle';
    if (uploading[docId]) return 'uploading';
    return uploadStatus[docId]?.status || 'idle';
}
// ───────────────────────────────────────────────────────────────────────────

// ─── Shared upload hook (individual file) ───────────────────────────────────
const useFileUpload = (applicationId, formData, onChange) => {
    const [uploadStatus, setUploadStatus] = useState({});
    const [uploading, setUploading] = useState({});

    const handleUpload = async (docId, endpoint, file) => {
        if (!file) return;
        setUploading(prev => ({ ...prev, [docId]: true }));
        setUploadStatus(prev => ({ ...prev, [docId]: { status: 'uploading', message: 'Uploading...' } }));

        try {
            const fd = new FormData();
            fd.append('application_id', applicationId);
            fd.append('file', file);
            await apiClient.post(endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } });

            setUploadStatus(prev => ({
                ...prev,
                [docId]: { status: 'success', message: 'Uploaded successfully', fileName: file.name, fileSize: (file.size / 1024).toFixed(2) + ' KB' },
            }));
            onChange({
                target: {
                    name: 'documents',
                    value: { ...(formData?.documents || {}), [docId]: { fileName: file.name, fileSize: file.size, uploadedAt: new Date().toISOString() } },
                },
            });
        } catch (error) {
            let msg = 'Upload failed. Please try again.';
            const data = error.response?.data;
            if (data) {
                if (Array.isArray(data.detail?.message)) msg = data.detail.message.map(e => e.msg).join(', ');
                else if (typeof data.detail?.message === 'string') msg = data.detail.message;
                else if (typeof data.message === 'string') msg = data.message;
            }
            setUploadStatus(prev => ({ ...prev, [docId]: { status: 'error', message: msg } }));
        } finally {
            setUploading(prev => ({ ...prev, [docId]: false }));
        }
    };

    // Inject statuses from a ZIP batch result (called by the modal on apply)
    const applyZipResults = (processedDocs) => {
        setUploadStatus(prev => ({ ...prev, ...processedDocs }));
    };

    return { uploadStatus, uploading, handleUpload, applyZipResults };
};

// ─── Large drag-and-drop / browse upload zone ───────────────────────────────
const UploadZone = ({ docId, label, endpoint, uploading, uploadStatus, onFileChange }) => {
    const [dragOver, setDragOver] = useState(false);
    const status = uploadStatus[docId];
    const isUploading = Boolean(uploading[docId]);

    const handleFiles = (files) => {
        const file = files?.[0];
        if (file) onFileChange(docId, endpoint, file);
    };

    return (
        <div className="doc-upload-zone-wrap">
            <label
                className={`doc-upload-zone doc-upload-zone--${status?.status || 'idle'} ${dragOver ? 'doc-upload-zone--drag' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (!isUploading) handleFiles(e.dataTransfer.files);
                }}
            >
                <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFiles(e.target.files)}
                    disabled={isUploading}
                    style={{ display: 'none' }}
                />
                <UploadCloudIcon />
                {status?.status === 'success' ? (
                    <>
                        <span className="doc-upload-zone-title">{status.fileName}</span>
                        <span className="doc-upload-zone-hint">
                            Uploaded{status.fileSize ? ` · ${status.fileSize}` : ''} — click or drop to replace
                        </span>
                    </>
                ) : isUploading ? (
                    <>
                        <span className="doc-upload-zone-title">Uploading…</span>
                        <span className="doc-upload-zone-hint">{label}</span>
                    </>
                ) : (
                    <>
                        <span className="doc-upload-zone-title">Drag &amp; drop your {label}</span>
                        <span className="doc-upload-zone-hint">or click to browse · PDF, JPG, PNG</span>
                    </>
                )}
            </label>

            {isUploading && (
                <div className="doc-upload-progress">
                    <div className="doc-upload-progress-fill" />
                </div>
            )}

            {status?.status === 'error' && <p className="doc-upload-error">{status.message}</p>}
        </div>
    );
};

// ─── ZIP upload modal ────────────────────────────────────────────────────────
const ZipModal = ({ applicationId, onApply, onClose }) => {
    const [zipFile, setZipFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleUpload = async () => {
        if (!zipFile) return;
        setUploading(true);
        setError(null);
        setResult(null);
        try {
            const fd = new FormData();
            fd.append('file', zipFile);
            const res = await apiClient.post(
                `/documents/upload/batch-zip/${applicationId}`,
                fd,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            setResult(res.data);
        } catch (err) {
            const data = err.response?.data;
            let msg = 'Upload failed. Please try again.';
            if (typeof data?.detail?.message === 'string') msg = data.detail.message;
            else if (typeof data?.detail === 'string') msg = data.detail;
            else if (typeof data?.message === 'string') msg = data.message;
            setError(msg);
        } finally {
            setUploading(false);
        }
    };

    const handleApply = () => {
        if (!result) return;
        // Build status patches and proof-type selections from PROCESSED docs
        const statusPatches = {};
        const proofSelections = {};

        result.documents?.forEach(doc => {
            const docId = DOC_TYPE_MAP[doc.doc_type];
            if (!docId) return;

            if (doc.status === 'PROCESSED') {
                statusPatches[docId] = {
                    status: 'success',
                    message: 'Uploaded via ZIP',
                    fileName: doc.file,
                    fileSize: null,
                };
                // Auto-select proof type if this doc belongs to one
                DOC_CONFIG.proofTypes.forEach(pt => {
                    if (pt.options.some(o => o.id === docId)) {
                        proofSelections[pt.id] = docId;
                    }
                });
            } else if (doc.status === 'FAILED') {
                statusPatches[docId] = {
                    status: 'error',
                    message: doc.reason?.message || 'Verification failed',
                    fileName: doc.file,
                };
            }
        });

        onApply(statusPatches, proofSelections);
        onClose();
    };

    const processed = result?.documents?.filter(d => d.status === 'PROCESSED') || [];

    return (
        // Backdrop
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'var(--bg-overlay)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: 'var(--spacing-xl)',
            }}
        >
            {/* Panel — stop clicks from closing */}
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-xl)',
                    width: '100%', maxWidth: '560px', maxHeight: '80vh',
                    overflowY: 'auto', boxShadow: 'var(--shadow-xl)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 'var(--font-size-lg)' }}>Upload ZIP Archive</h3>
                        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
                            Max 50 MB · up to 20 files · PDF, JPG, PNG
                        </p>
                    </div>
                    <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
                </div>

                {/* Hint */}
                <div style={{ background: 'var(--panel-info-bg)', border: '1px solid var(--panel-info-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-sm) var(--spacing-md)', marginBottom: 'var(--spacing-lg)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    Name each file with a keyword so it's recognised: <br />
                    <code style={{ color: 'var(--primary-color)' }}>pan</code>, <code style={{ color: 'var(--primary-color)' }}>aadhaar</code>, <code style={{ color: 'var(--primary-color)' }}>voter</code>, <code style={{ color: 'var(--primary-color)' }}>passport</code>, <code style={{ color: 'var(--primary-color)' }}>utility</code>, <code style={{ color: 'var(--primary-color)' }}>salary</code>, <code style={{ color: 'var(--primary-color)' }}>form16</code>, <code style={{ color: 'var(--primary-color)' }}>itr</code>, <code style={{ color: 'var(--primary-color)' }}>bank</code>
                </div>

                {/* File picker */}
                <label
                    style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)',
                        padding: 'var(--spacing-md) var(--spacing-lg)',
                        background: 'var(--bg-glass)',
                        border: `2px dashed ${zipFile ? 'var(--primary-color)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-md)', cursor: uploading ? 'not-allowed' : 'pointer',
                        marginBottom: 'var(--spacing-md)', transition: 'all var(--transition-base)',
                    }}
                >
                    <input type="file" accept=".zip" onChange={e => { setZipFile(e.target.files[0] || null); setResult(null); setError(null); }} disabled={uploading} style={{ display: 'none' }} />
                    <span style={{ fontSize: '24px' }}>🗜️</span>
                    <div>
                        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: zipFile ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: zipFile ? 600 : 400 }}>
                            {zipFile ? zipFile.name : 'Choose a .zip file'}
                        </p>
                        {zipFile && <p style={{ margin: '2px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{(zipFile.size / (1024 * 1024)).toFixed(2)} MB</p>}
                    </div>
                </label>

                {/* Progress */}
                {uploading && (
                    <div style={{ marginBottom: 'var(--spacing-md)', height: '4px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--accent-gradient)', animation: 'doc-indeterminate 1.5s ease-in-out infinite', width: '50%' }} />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{ padding: 'var(--spacing-sm) var(--spacing-md)', borderRadius: 'var(--radius-md)', background: 'var(--panel-error-bg)', border: '1px solid var(--panel-error-border)', color: 'var(--error-color)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-md)' }}>
                        ✗ {error}
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        {/* Summary counts */}
                        <div style={{ display: 'flex', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm) var(--spacing-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                            {[
                                { label: 'Total',     value: result.total_files, color: 'var(--text-primary)' },
                                { label: 'Processed', value: result.processed,   color: 'var(--success-color)' },
                                { label: 'Failed',    value: result.failed,      color: result.failed   > 0 ? 'var(--error-color)'   : 'var(--text-muted)' },
                                { label: 'Skipped',   value: result.skipped,     color: result.skipped  > 0 ? 'var(--accent-color)'  : 'var(--text-muted)' },
                            ].map(({ label, value, color }) => (
                                <div key={label} style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color }}>{value}</div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Per-file rows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                            {result.documents?.map((doc, i) => {
                                const isOk = doc.status === 'PROCESSED';
                                const color = isOk ? 'var(--success-color)' : doc.status === 'FAILED' ? 'var(--error-color)' : 'var(--text-muted)';
                                return (
                                    <div key={i} style={{ padding: 'var(--spacing-sm) var(--spacing-md)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                            <span style={{ color, fontWeight: 700 }}>{isOk ? '✓' : doc.status === 'FAILED' ? '✗' : '—'}</span>
                                            <span style={{ flex: 1, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>{doc.file}</span>
                                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{doc.doc_type?.replace(/_/g, ' ')}</span>
                                            {doc.ocr_confidence != null && (
                                                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{Math.round(doc.ocr_confidence * 100)}%</span>
                                            )}
                                        </div>
                                        {doc.status === 'FAILED' && doc.reason && (
                                            <div style={{ marginTop: '4px', marginLeft: 'var(--spacing-lg)', fontSize: 'var(--font-size-xs)', color: 'var(--error-color)' }}>
                                                {doc.reason.message}
                                                {doc.reason.mismatches?.map((m, j) => (
                                                    <span key={j} style={{ marginLeft: 8, color: 'var(--text-muted)' }}>
                                                        {m.field}: expected <strong style={{ color: 'var(--success-color)' }}>{m.expected}</strong>, got <strong style={{ color: 'var(--error-color)' }}>{m.actual}</strong>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    {!result
                        ? <Button type="button" variant="secondary" onClick={handleUpload} disabled={!zipFile || uploading}>{uploading ? 'Uploading…' : 'Upload'}</Button>
                        : <Button type="button" variant="primary" onClick={handleApply} disabled={processed.length === 0}>Apply {processed.length} accepted doc{processed.length !== 1 ? 's' : ''}</Button>
                    }
                </div>
            </div>
        </div>
    );
};

// ─── Main component ──────────────────────────────────────────────────────────
const DocumentUpload = ({ formData, onChange, applicationId, onContinue, isContinuing = false }) => {
    const navigate = useNavigate();
    const { uploadStatus, uploading, handleUpload, applyZipResults } = useFileUpload(applicationId, formData, onChange);
    const [selectedProofOptions, setSelectedProofOptions] = useState({});
    const [zipModalOpen, setZipModalOpen] = useState(false);
    const [activeGroupId, setActiveGroupId] = useState(GROUPS[0].id);

    const handleSelectProofOption = (proofTypeId, optionId) => {
        setSelectedProofOptions(prev => ({ ...prev, [proofTypeId]: optionId }));
    };

    const handleZipApply = (statusPatches, proofSelections) => {
        applyZipResults(statusPatches);
        setSelectedProofOptions(prev => ({ ...prev, ...proofSelections }));
        // Update parent documents map for successfully patched docs
        const docsMap = { ...(formData?.documents || {}) };
        Object.entries(statusPatches).forEach(([id, s]) => {
            if (s.status === 'success') docsMap[id] = { fileName: s.fileName, uploadedAt: new Date().toISOString() };
        });
        onChange({ target: { name: 'documents', value: docsMap } });
    };

    const handleNeedHelp = () => {
        toast.info("Our support team is available in-app any time — we're here if you need us.");
    };

    const activeGroup = GROUPS.find(g => g.id === activeGroupId) || GROUPS[0];
    const activeOptionId = activeGroup.kind === 'choice' ? selectedProofOptions[activeGroup.id] : null;
    const activeOption = activeOptionId ? activeGroup.options.find(o => o.id === activeOptionId) : null;

    return (
        <div className="aj-page doc-page">
            <div className="aj-topbar">
                <button type="button" className="aj-topbar-btn" onClick={() => navigate(-1)}>
                    <ArrowLeftIcon /> Back
                </button>
                <button type="button" className="aj-topbar-btn" onClick={handleNeedHelp}>
                    Need Help?
                </button>
            </div>

            <div className="aj-hero doc-hero">
                <span className="aj-success-badge">
                    <CheckCircleIcon /> Application Submitted
                </span>
                <h1 className="aj-hero-title">Upload Your Documents</h1>
                <p className="aj-hero-subtitle">
                    Upload the required documents to verify your identity and continue processing your loan application.
                </p>
            </div>

            <div className="doc-layout">
                <section className="doc-list-panel" aria-label="Required documents">
                    <h2 className="doc-panel-heading">Required Documents</h2>
                    <ul className="doc-list">
                        {GROUPS.map((group) => {
                            const status = groupStatus(group, { uploading, uploadStatus, selectedProofOptions });
                            const isActive = group.id === activeGroupId;
                            return (
                                <li key={group.id}>
                                    <button
                                        type="button"
                                        className={`doc-row doc-row--${status} ${isActive ? 'doc-row--active' : ''}`}
                                        onClick={() => setActiveGroupId(group.id)}
                                    >
                                        <span className="doc-row-status-icon" aria-hidden="true">
                                            {status === 'success' && <CheckIcon />}
                                            {status === 'error' && <ExclaimIcon />}
                                            {status === 'uploading' && <span className="doc-row-spinner" />}
                                        </span>
                                        <span className="doc-row-text">
                                            <span className="doc-row-title">{group.label}</span>
                                            <span className="doc-row-meta">
                                                {group.required ? 'Required' : 'Optional'} · {STATUS_LABEL[status]}
                                            </span>
                                        </span>
                                        <ChevronIcon />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </section>

                <section className="doc-upload-panel" aria-label="Upload documents">
                    <div className="doc-upload-panel-head">
                        <h2 className="doc-panel-heading">{activeGroup.label}</h2>
                        <button type="button" className="doc-zip-trigger" onClick={() => setZipModalOpen(true)}>
                            🗜️ Upload ZIP instead
                        </button>
                    </div>

                    {activeGroup.kind === 'choice' && (
                        <>
                            <p className="doc-upload-panel-desc">{activeGroup.description}</p>
                            <div className="doc-option-chips">
                                {activeGroup.options.map((opt) => {
                                    const isSelected = activeOptionId === opt.id;
                                    const optStatus = uploadStatus[opt.id]?.status;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            className={`doc-chip ${isSelected ? 'doc-chip--selected' : ''} ${optStatus === 'success' ? 'doc-chip--success' : ''}`}
                                            onClick={() => handleSelectProofOption(activeGroup.id, opt.id)}
                                        >
                                            {optStatus === 'success' && <CheckIcon />}
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {activeGroup.kind === 'single' ? (
                        <UploadZone
                            docId={activeGroup.id}
                            label={activeGroup.label}
                            endpoint={activeGroup.endpoint}
                            uploading={uploading}
                            uploadStatus={uploadStatus}
                            onFileChange={handleUpload}
                        />
                    ) : activeOption ? (
                        <UploadZone
                            docId={activeOption.id}
                            label={activeOption.label}
                            endpoint={activeOption.endpoint}
                            uploading={uploading}
                            uploadStatus={uploadStatus}
                            onFileChange={handleUpload}
                        />
                    ) : (
                        <div className="doc-upload-placeholder">Select a document type above to upload.</div>
                    )}

                    <p className="doc-upload-caption">
                        Supported formats: PDF, JPG, PNG · Maximum size: 10 MB per document
                    </p>
                </section>

                <div className="doc-guidelines">
                    <h3 className="doc-guidelines-title">Upload Guidelines</h3>
                    <ul>
                        <li>PDF, JPG, PNG supported</li>
                        <li>Maximum 10 MB per document</li>
                        <li>Documents must be clear and readable</li>
                        <li>PAN Card is mandatory</li>
                    </ul>
                </div>
            </div>

            <div className="doc-footer">
                <Button
                    type="button"
                    variant="primary"
                    onClick={onContinue}
                    disabled={isContinuing}
                    loading={isContinuing}
                >
                    {isContinuing ? "Submitting…" : "Continue To Verification"}
                </Button>
            </div>

            {zipModalOpen && (
                <ZipModal
                    applicationId={applicationId}
                    onApply={handleZipApply}
                    onClose={() => setZipModalOpen(false)}
                />
            )}
        </div>
    );
};

const ArrowLeftIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" />
        <path d="M5.2 8.2 7.2 10.2 11 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const CheckIcon = () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
        <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ExclaimIcon = () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 2a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 10.5a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z" />
    </svg>
);

const ChevronIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const UploadCloudIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M7 18a4.5 4.5 0 0 1-.4-8.98A5.5 5.5 0 0 1 17.4 8.06 4 4 0 0 1 17 18H7z" strokeLinejoin="round" />
        <path d="M12 11v6.5M9.5 13.5 12 11l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default DocumentUpload;
