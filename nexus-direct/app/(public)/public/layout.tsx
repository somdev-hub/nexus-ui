import React from 'react'

const PublicLayout = ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => {
    return (
        <div className="min-h-screen bg-background">
            <div className="py-4 px-8 flex-1">
                {children}
            </div>
        </div>
    )
}

export default PublicLayout