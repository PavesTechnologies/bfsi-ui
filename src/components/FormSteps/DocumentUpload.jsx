import React, { useState } from 'react';
import Button from '../FormElements/Button';
import apiClient from '../../api/client';
import '../../styles/components.css';

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
// ───────────────────────────────────────────────────────────────────────────

const getStatusIcon  = (s) => ({ uploading: '⏳', success: '✓', error: '✗' }[s] || '');
const getStatusColor = (s) => ({
    uploading: 'var(--accent-color)',
    success:   'var(--success-color)',
    error:     'var(--error-color)',
}[s] || 'var(--text-muted)');

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

// ─── Single upload row ───────────────────────────────────────────────────────
const UploadRow = ({ docId, endpoint, uploading, uploadStatus, onFileChange }) => (
    <div style={{ marginTop: 'var(--spacing-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <label
                style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    background: 'var(--bg-glass)', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all var(--transition-base)',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary-color)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
                <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => onFileChange(docId, endpoint, e.target.files[0])}
                    disabled={uploading[docId]}
                    style={{ display: 'none' }}
                />
                <span style={{ fontSize: '20px' }}>📎</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    {uploadStatus[docId]?.fileName || 'Choose file...'}
                </span>
            </label>

            {uploadStatus[docId] && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: getStatusColor(uploadStatus[docId].status), fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                    <span style={{ fontSize: '18px' }}>{getStatusIcon(uploadStatus[docId].status)}</span>
                    <span>{uploadStatus[docId].message}</span>
                    {uploadStatus[docId].fileSize && (
                        <span style={{ color: 'var(--text-muted)', marginLeft: 'var(--spacing-xs)' }}>
                            ({uploadStatus[docId].fileSize})
                        </span>
                    )}
                </div>
            )}
        </div>

        {uploading[docId] && (
            <div style={{ marginTop: 'var(--spacing-sm)', height: '4px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--accent-gradient)', animation: 'progress 1.5s ease-in-out infinite', width: '50%' }} />
            </div>
        )}
    </div>
);

// ─── Proof-type section ──────────────────────────────────────────────────────
const ProofSection = ({ proofType, selectedOption, onSelectOption, uploading, uploadStatus, onFileChange }) => (
    <div className="dynamic-list-item" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ display: 'block', fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--spacing-xs)' }}>
                {proofType.label}
                <span style={{ color: 'var(--error-color)', marginLeft: '4px' }}>*</span>
            </label>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)' }}>
                {proofType.description}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                {proofType.options.map(opt => {
                    const isSelected = selectedOption === opt.id;
                    const status = uploadStatus[opt.id]?.status;
                    return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => onSelectOption(proofType.id, opt.id)}
                            style={{
                                padding: 'var(--spacing-xs) var(--spacing-md)',
                                borderRadius: 'var(--radius-md)',
                                border: `1px solid ${isSelected ? 'var(--primary-color)' : status === 'success' ? 'var(--success-color)' : 'var(--border-color)'}`,
                                background: isSelected ? 'var(--accent-tint-120)' : status === 'success' ? 'var(--success-tint-80)' : 'var(--bg-glass)',
                                color: isSelected ? 'var(--primary-color)' : status === 'success' ? 'var(--success-color)' : 'var(--text-secondary)',
                                fontWeight: isSelected || status === 'success' ? 600 : 400,
                                fontSize: 'var(--font-size-sm)',
                                cursor: 'pointer',
                                transition: 'all var(--transition-base)',
                                display: 'flex', alignItems: 'center', gap: '6px',
                            }}
                        >
                            {status === 'success' && <span>✓</span>}
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>

        {selectedOption && (() => {
            const opt = proofType.options.find(o => o.id === selectedOption);
            return opt ? (
                <UploadRow
                    docId={opt.id}
                    endpoint={opt.endpoint}
                    uploading={uploading}
                    uploadStatus={uploadStatus}
                    onFileChange={onFileChange}
                />
            ) : null;
        })()}
    </div>
);

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
                        <div style={{ height: '100%', background: 'var(--accent-gradient)', animation: 'progress 1.5s ease-in-out infinite', width: '50%' }} />
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
const DocumentUpload = ({ formData, onChange, applicationId, onContinue }) => {
    const { uploadStatus, uploading, handleUpload, applyZipResults } = useFileUpload(applicationId, formData, onChange);
    const [selectedProofOptions, setSelectedProofOptions] = useState({});
    const [zipModalOpen, setZipModalOpen] = useState(false);

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


    return (
        <div className="card fade-in">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 className="card-title">Document Upload</h2>
                    <p className="card-subtitle">Please upload the required documents for verification</p>
                </div>
                <button
                    type="button"
                    onClick={() => setZipModalOpen(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: 'var(--spacing-xs) var(--spacing-md)',
                        background: 'var(--bg-glass)', border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)',
                        fontSize: 'var(--font-size-sm)', cursor: 'pointer',
                        transition: 'all var(--transition-base)', fontWeight: 500, whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.color = 'var(--primary-color)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                    🗜️ Upload ZIP
                </button>
            </div>

            <div style={{ background: 'var(--panel-info-bg)', border: '1px solid var(--panel-info-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-xs)' }}>
                    📋 <strong>Document Requirements:</strong>
                </p>
                <ul style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginLeft: 'var(--spacing-lg)' }}>
                    <li>Files must be in PDF, JPG, or PNG format</li>
                    <li>Maximum file size: 10 MB per document</li>
                    <li>Documents must be clear and legible</li>
                    <li>PAN Card is mandatory; upload one Address Proof and one Income Proof</li>
                </ul>
            </div>

            {/* Mandatory documents */}
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)' }}>
                Mandatory Documents
            </h3>
            {DOC_CONFIG.mandatory.map(doc => (
                <div key={doc.id} className="dynamic-list-item" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <label style={{ display: 'block', fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--spacing-xs)' }}>
                        {doc.label}
                        <span style={{ color: 'var(--error-color)', marginLeft: '4px' }}>*</span>
                    </label>
                    <UploadRow
                        docId={doc.id}
                        endpoint={doc.endpoint}
                        uploading={uploading}
                        uploadStatus={uploadStatus}
                        onFileChange={handleUpload}
                    />
                </div>
            ))}

            {/* Proof-type sections */}
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 'var(--spacing-xl) 0 var(--spacing-md)' }}>
                Supporting Documents
            </h3>
            {DOC_CONFIG.proofTypes.map(pt => (
                <ProofSection
                    key={pt.id}
                    proofType={pt}
                    selectedOption={selectedProofOptions[pt.id]}
                    onSelectOption={handleSelectProofOption}
                    uploading={uploading}
                    uploadStatus={uploadStatus}
                    onFileChange={handleUpload}
                />
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-xl)' }}>
                <Button
                    type="button"
                    variant="primary"
                    onClick={onContinue}
                    // disabled={!canContinue}
                >
                    Continue To Verification
                </Button>
            </div>

            {zipModalOpen && (
                <ZipModal
                    applicationId={applicationId}
                    onApply={handleZipApply}
                    onClose={() => setZipModalOpen(false)}
                />
            )}

            <style>{`
                @keyframes progress {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
            `}</style>
        </div>
    );
};

export default DocumentUpload;
