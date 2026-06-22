import Navbar from '@/components/navbar';
import React from 'react'

const MainLayout = ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => {
    return (
        <div>
            <div className="mb-10">
                <Navbar />
            </div>
            <div className="py-4 px-8 flex-1">
                {children}
            </div>
        </div>
    )
}

export default MainLayout