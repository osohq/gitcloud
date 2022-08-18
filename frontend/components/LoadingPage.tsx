import { FunctionComponent, useEffect, useState } from "react";
import Spinner from "./Spinner";

const LoadingPage: FunctionComponent = () => {
    // Only show loading page if it is visible for more than 300ms
    const [show, setShow] = useState(false);
    useEffect(() => {
        const timeout = setTimeout(() => setShow(true), 300);
        return () => clearTimeout(timeout);
    }, []);

    if (!show) return null;

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center text-gray-600">
            <Spinner size={50} />
            <div className="mt-6" />
            <span className="text-3xl font-space">Loading</span>
        </div>
    );
};

export default LoadingPage;
