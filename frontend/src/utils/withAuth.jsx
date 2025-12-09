import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const withAuth = (WrappedComponent) => {
    return function AuthComponent(props) {
        const navigate = useNavigate();

        useEffect(() => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/auth");
            }
        }, []);

        return <WrappedComponent {...props} />;
    };
};

export default withAuth;
