import React, { useState, useRef, useEffect } from 'react';
import '../../styles/components.css';

const UserIcon = () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
    </svg>
);

const BriefcaseIcon = () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1h-3zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5zm1.886 6.914L15 7.151V12.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V7.15l6.614 1.764a1.5 1.5 0 0 0 .772 0zM1.5 4h13a.5.5 0 0 1 .5.5v1.616L8.129 7.948a.5.5 0 0 1-.258 0L1 6.116V4.5a.5.5 0 0 1 .5-.5z" />
    </svg>
);

const LocationIcon = () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z" />
        <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    </svg>
);

const TagIcon = () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 2 6.586V2zm3.5 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
    </svg>
);

const BankIcon = () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 .95 14.61 4h.89a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H15v7h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1V7H.5a.5.5 0 0 1-.5-.5v-2A.5.5 0 0 1 .5 4h.89L8 .95zM3.776 4h8.447L8 2.05 3.776 4zM2 7v7h1V7H2zm2 0v7h2.5V7H4zm3.5 0v7h1V7h-1zm2 0v7H12V7H9.5zM13 7v7h1V7h-1zm2-1V5H1v1h14zm-1 8H2v1h12v-1z" />
    </svg>
);

const ChannelIcon = () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .49.598l-1 5a.5.5 0 0 1-.465.401l-9.397.472L4.415 11H13a.5.5 0 0 1 0 1H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l.84 4.479 9.144-.459.75-3.75L3.102 4zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
    </svg>
);

const TickIcon = () => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
    </svg>
);

const getAutoIcon = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('gender') || n.includes('suffix')) return <UserIcon />;
    if (n.includes('role') || n.includes('applicant') || n.includes('employment') || n.includes('occupation')) return <BriefcaseIcon />;
    if (n.includes('state') || n.includes('city') || n.includes('country') || n.includes('district')) return <LocationIcon />;
    if (n.includes('type') || n.includes('credit')) return <TagIcon />;
    if (n.includes('bank')) return <BankIcon />;
    if (n.includes('channel')) return <ChannelIcon />;
    return null;
};

const Select = ({
    label,
    name,
    value,
    onChange,
    options = [],
    error,
    placeholder = 'Select an option',
    required = false,
    icon,
    noIcon = false,
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const wrapperRef = useRef(null);
    const dropdownRef = useRef(null);

    const resolvedIcon = noIcon ? null : (icon !== undefined ? icon : getAutoIcon(name));
    const allOptions = [{ value: '', label: placeholder, isPlaceholder: true }, ...options];
    const selectedOption = options.find(opt => String(opt.value) === String(value));

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
                setFocusedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => {
        if (!isOpen) {
            const idx = allOptions.findIndex(opt => String(opt.value) === String(value));
            setFocusedIndex(idx >= 0 ? idx : 0);
        }
        setIsOpen(prev => !prev);
    };

    const handleSelect = (optionValue) => {
        onChange({ target: { name, value: optionValue } });
        setIsOpen(false);
        setFocusedIndex(-1);
    };

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
                setFocusedIndex(0);
            }
            return;
        }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex(prev => Math.min(prev + 1, allOptions.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (focusedIndex >= 0) handleSelect(allOptions[focusedIndex].value);
                break;
            case 'Escape':
            case 'Tab':
                setIsOpen(false);
                setFocusedIndex(-1);
                break;
        }
    };

    useEffect(() => {
        if (isOpen && dropdownRef.current && focusedIndex >= 0) {
            dropdownRef.current.children[focusedIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }, [focusedIndex, isOpen]);

    return (
        <div className="form-group">
            {label && (
                <label htmlFor={name} className="form-label">
                    {label}{required && <span className="required-star">*</span>}
                </label>
            )}
            <div className="form-input-wrapper custom-select-wrapper" ref={wrapperRef}>
                {resolvedIcon && (
                    <span className="form-input-icon form-input-icon-left">{resolvedIcon}</span>
                )}
                <button
                    type="button"
                    id={name}
                    className={[
                        'custom-select-trigger',
                        'form-input',
                        error && 'error',
                        isOpen && 'is-open',
                        resolvedIcon && 'has-icon',
                        !value && 'is-placeholder'
                    ].filter(Boolean).join(' ')}
                    onClick={handleToggle}
                    onKeyDown={handleKeyDown}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    <span className="custom-select-value">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <span className={`custom-select-chevron${isOpen ? ' is-open' : ''}`}>
                        <ChevronDownIcon />
                    </span>
                </button>

                {isOpen && (
                    <div className="custom-select-dropdown" role="listbox" ref={dropdownRef}>
                        {allOptions.map((option, i) => (
                            <div
                                key={i}
                                className={[
                                    'custom-select-option',
                                    String(option.value) === String(value) && 'is-selected',
                                    i === focusedIndex && 'is-focused',
                                    option.isPlaceholder && 'is-placeholder'
                                ].filter(Boolean).join(' ')}
                                role="option"
                                aria-selected={String(option.value) === String(value)}
                                onMouseDown={(e) => { e.preventDefault(); handleSelect(option.value); }}
                                onMouseEnter={() => setFocusedIndex(i)}
                            >
                                <span className="custom-select-option-label">{option.label}</span>
                                {String(option.value) === String(value) && !option.isPlaceholder && (
                                    <span className="custom-select-option-check"><TickIcon /></span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {error && <span className="form-error">{error}</span>}
        </div>
    );
};

export default Select;
