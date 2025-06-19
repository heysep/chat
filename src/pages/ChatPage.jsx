import React, { useState } from "react";
import ProductManagement from "../components/ProductManagement";
import ChatRoom from "../components/ChatRoom";
import TransactionManagement from "../components/TransactionManagement";
import ChatRoomManagement from "../components/ChatRoomManagement";

// 채팅방 컨텍스트
const ChatPage = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("products"); // 상품관리를 기본 탭으로 변경

  const BASE_URL = "http://localhost:8080/api";

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}/users/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }
    onLogout();
  };

  const welcomeName =
    user.user_name || user.userName || user.company_name || "";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {activeTab === "products" ? "상품 관리" : activeTab === "transactions" ? "거래 관리" : "채팅방 관리"}
              </h1>
              <p className="text-sm text-gray-500">
                {welcomeName}님 환영합니다
              </p>
              <div className="mt-2 space-x-2">
                <button
                  onClick={() => setActiveTab("products")}
                  className={`text-xs px-3 py-1 rounded-full ${
                    activeTab === "products"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  상품 관리
                </button>
                <button
                  onClick={() => setActiveTab("transactions")}
                  className={`text-xs px-3 py-1 rounded-full ${
                    activeTab === "transactions"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  거래 관리
                </button>
                <button
                  onClick={() => setActiveTab("chatrooms")}
                  className={`text-xs px-3 py-1 rounded-full ${
                    activeTab === "chatrooms"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  채팅방 관리
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleLogout}
                className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full hover:bg-red-100 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeTab === "products" ? (
        <ProductManagement user={user} onLogout={onLogout} />
      ) : activeTab === "transactions" ? (
        <TransactionManagement user={user} onLogout={onLogout} />
      ) : (
        <ChatRoomManagement 
          user={user} 
          onLogout={onLogout}
        />
      )}
    </div>
  );
};

export default ChatPage;
