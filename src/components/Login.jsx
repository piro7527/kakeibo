import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

const Login = () => {
    const [error, setError] = useState(null);

    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error(error);
            setError("ログインに失敗しました。もう一度お試しください。");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="mb-6">
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500 mb-2">
                        AIレシート家計簿
                    </h1>
                    <p className="text-gray-500 text-sm">Family Edition</p>
                </div>

                <div className="mb-8">
                    <p className="text-gray-600 mb-6">
                        Googleアカウントでログインして、<br />
                        家計簿の自動化を始めましょう。
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 transform active:scale-95 transition-transform hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg shadow-sm"
                    >
                        <img
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                            alt="Google logo"
                            className="w-6 h-6"
                        />
                        <span>Googleでログイン</span>
                    </button>
                </div>

                <div className="text-xs text-gray-400">
                    プライベートかつセキュアにデータを保存します
                </div>
            </div>
        </div>
    );
};

export default Login;
