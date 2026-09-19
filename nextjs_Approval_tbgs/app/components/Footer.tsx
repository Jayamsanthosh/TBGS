import React from 'react';

const Footer = () => {
    return (
        <footer className="mt-auto border-t border-gray-200 bg-white py-3">
            <div className="w-full mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <p>© {new Date().getFullYear()} Vision Infotech Ltd. All rights reserved.</p>
                    <p className="mt-1 md:mt-0">Approval System v1.0.0</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;