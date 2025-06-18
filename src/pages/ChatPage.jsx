import React, { useState, useEffect } from "react";

// 채팅방 컨텍스트
const ChatPage = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("chat");
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const initialChatRoomIdx = (() => {
    const stored = localStorage.getItem("chatRoomIdx");
    return stored ? Number(stored) : 1;
  })();

  const [chatRoomIdx, setChatRoomIdx] = useState(initialChatRoomIdx);

  const [messages, setMessages] = useState(() => {
    const stored = localStorage.getItem(`messages_${initialChatRoomIdx}`);
    return stored ? JSON.parse(stored) : [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const [products, setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodError, setProdError] = useState(null);

  // 상품 등록 폼 상태
  const [productForm, setProductForm] = useState({
    productTitle: "",
    productDesc: "",
    productPrice: "",
    productImg: "default.jpg",
    productQuantity: 1,
    productStatus: "AVAILABLE",
    category: "",
    tags: [],
    isSellingAvailable: true,
    seller_user_idx: user?.user_idx || 1,
  });
  const [registering, setRegistering] = useState(false);

  const BASE_URL = "http://localhost:8080/api";

  useEffect(() => {
    localStorage.setItem("chatRoomIdx", chatRoomIdx);
  }, [chatRoomIdx]);

  // 메시지 조회 함수
  const fetchMessages = async () => {
    try {
      const response = await fetch(`${BASE_URL}/chatmsg/${chatRoomIdx}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 세션 유지
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const messageData = Array.isArray(data) ? data : [];

      // chatSendDate 기준으로 오름차순 정렬
      const sortedMessages = messageData.sort(
        (a, b) => new Date(a.chatSendDate) - new Date(b.chatSendDate)
      );

      setMessages(sortedMessages);
      localStorage.setItem(
        `messages_${chatRoomIdx}`,
        JSON.stringify(sortedMessages)
      );
      setError(null);
      setLastUpdate(new Date());
      console.log("받아온 메시지 데이터:", sortedMessages);
    } catch (err) {
      console.error("메시지 조회 실패:", err);
      setError(`메시지를 불러오는데 실패했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드 및 5초마다 새로고침
  useEffect(() => {
    const stored = localStorage.getItem(`messages_${chatRoomIdx}`);
    if (stored) {
      setMessages(JSON.parse(stored));
    } else {
      setMessages([]);
    }
    setLoading(true);
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [chatRoomIdx]);

  // 상품 게시글 조회
  const fetchProducts = async () => {
    setProdLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/products/list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      const filtered = list.filter((item) => {
        const owner =
          item.sellerUserIdx ??
          item.writerUserIdx ??
          item.userIdx ??
          item.user_idx;
        return owner !== user.user_idx;
      });

      setProducts(filtered);
      setProdError(null);
    } catch (err) {
      console.error("상품 목록 조회 실패:", err);
      setProdError(err.message);
    } finally {
      setProdLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "products") {
      fetchProducts();
    }
  }, [activeTab]);

  // 상품 등록 함수
  const handleProductRegister = async () => {
    if (
      !productForm.productTitle.trim() ||
      !productForm.productDesc.trim() ||
      !productForm.category.trim()
    ) {
      alert("제목, 설명, 카테고리는 필수 입력 항목입니다.");
      return;
    }

    setRegistering(true);
    try {
      const response = await fetch(`${BASE_URL}/products/register/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...productForm,
          productPrice: Number(productForm.productPrice),
          productQuantity: Number(productForm.productQuantity),
          seller_user_idx: user.user_idx,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      alert("상품이 성공적으로 등록되었습니다!");
      setShowRegisterModal(false);

      // 폼 초기화
      setProductForm({
        productTitle: "",
        productDesc: "",
        productPrice: "",
        productImg: "default.jpg",
        productQuantity: 1,
        productStatus: "AVAILABLE",
        category: "",
        tags: [],
        isSellingAvailable: true,
        seller_user_idx: user.user_idx,
      });

      // 상품 목록 새로고침
      if (activeTab === "products") {
        fetchProducts();
      }
    } catch (err) {
      console.error("상품 등록 실패:", err);
      alert(`상품 등록에 실패했습니다: ${err.message}`);
    } finally {
      setRegistering(false);
    }
  };

  // 태그 입력 처리
  const handleTagInput = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim();
      if (!productForm.tags.includes(newTag)) {
        setProductForm((prev) => ({
          ...prev,
          tags: [...prev.tags, newTag],
        }));
      }
      e.target.value = "";
    }
  };

  // 태그 제거
  const removeTag = (tagToRemove) => {
    setProductForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // idx가 큰 사람을 왼쪽(false), 작은 사람을 오른쪽(true)으로 배치
  const isRightSide = (message) => {
    // 모든 메시지의 senderUserIdx를 수집해서 최대값을 구함
    const allUserIdxs = messages.map((msg) => msg.senderUserIdx);
    const maxIdx = Math.max(...allUserIdxs);

    // 현재 메시지의 senderUserIdx가 최대값보다 작으면 오른쪽(true)
    return message.senderUserIdx < maxIdx;
  };

  // 내 메시지인지 판별 (기존 로직 유지 - 참고용)
  const isMyMessage = (message) => {
    return message.senderUserIdx === user.user_idx;
  };

  // 시간 포맷팅
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "오늘";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "어제";
    } else {
      return date.toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
      });
    }
  };

  // 날짜 구분선 필요 여부
  const needsDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    const currentDate = new Date(currentMessage.chatSendDate);
    const previousDate = new Date(previousMessage.chatSendDate);
    return currentDate.toDateString() !== previousDate.toDateString();
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">메시지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {activeTab === "chat" ? "채팅방" : "상품 게시글"}
              </h1>
              <p className="text-sm text-gray-500">
                {user.company_name}님 환영합니다
              </p>
              <div className="mt-2 space-x-2">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`text-xs px-3 py-1 rounded-full ${
                    activeTab === "chat"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  채팅
                </button>
                <button
                  onClick={() => setActiveTab("products")}
                  className={`text-xs px-3 py-1 rounded-full ${
                    activeTab === "products"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  상품 게시글
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {activeTab === "chat" ? (
                <>
                  <select
                    className="text-xs border-gray-300 rounded px-2 py-1"
                    value={chatRoomIdx}
                    onChange={(e) => setChatRoomIdx(Number(e.target.value))}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((idx) => (
                      <option key={idx} value={idx}>
                        방 {idx}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-gray-400">
                    채팅방 #{chatRoomIdx}
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
                >
                  새 상품 등록
                </button>
              )}
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

      {activeTab === "chat" ? (
        <>
          <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {messages.map((message, index) => {
                const isRight = isRightSide(message);
                const messageText = message.chatMsgContent || "";
                const senderName = message.senderName;
                const showDateSeparator = needsDateSeparator(
                  message,
                  messages[index - 1]
                );

                return (
                  <div key={`${message.chatMsgIdx}-${index}`}>
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-6">
                        <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                          {formatDate(message.chatSendDate)}
                        </div>
                      </div>
                    )}

                    <div
                      className={`flex ${
                        isRight ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex flex-col max-w-xs lg:max-w-md ${
                          isRight ? "items-end" : "items-start"
                        }`}
                      >
                        {!isRight && (
                          <div className="text-xs text-gray-500 mb-1 px-2">
                            {senderName} (idx: {message.senderUserIdx})
                          </div>
                        )}

                        <div
                          className={`px-4 py-3 rounded-2xl shadow-sm ${
                            isRight
                              ? "bg-blue-500 text-white rounded-br-md"
                              : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {messageText}
                          </p>
                        </div>

                        <div
                          className={`text-xs text-gray-400 mt-1 px-2 ${
                            isRight ? "text-right" : "text-left"
                          }`}
                        >
                          {formatTime(message.chatSendDate)}
                          {isRight && (
                            <div className="text-xs text-gray-400">
                              idx: {message.senderUserIdx}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {messages.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">💬</div>
                <p className="text-gray-500 text-lg">아직 메시지가 없습니다.</p>
                <p className="text-gray-400 text-sm mt-2">
                  채팅을 시작해보세요!
                </p>
              </div>
            )}
          </div>

          <div className="fixed bottom-4 right-4 flex flex-col space-y-2">
            <div className="bg-white rounded-full shadow-lg px-3 py-2 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600">5초마다 새로고침</span>
            </div>

            <div className="bg-white rounded-lg shadow-lg px-3 py-2 text-xs text-gray-500 text-center">
              마지막 업데이트: {lastUpdate.toLocaleTimeString("ko-KR")}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 overflow-y-auto">
          {prodError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{prodError}</p>
            </div>
          )}
          {prodLoading ? (
            <div className="text-center py-12 text-gray-500">
              목록을 불러오는 중...
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product.productIdx || product.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                >
                  <h3 className="font-semibold text-gray-900">
                    {product.title || product.productName || "제목 없음"}
                  </h3>
                  {product.price && (
                    <p className="text-sm text-gray-500 mt-1">
                      가격: {product.price}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    판매자:{" "}
                    {product.sellerName ||
                      product.writerName ||
                      product.userName}
                  </p>
                  {product.content && (
                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                      {product.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          {products.length === 0 && !prodLoading && !prodError && (
            <div className="text-center py-12 text-gray-500">
              게시글이 없습니다.
            </div>
          )}
        </div>
      )}

      {/* 상품 등록 모달 */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  새 상품 등록
                </h2>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={registering}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상품명 *
                  </label>
                  <input
                    type="text"
                    value={productForm.productTitle}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        productTitle: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="상품명을 입력하세요"
                    disabled={registering}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상품 설명 *
                  </label>
                  <textarea
                    value={productForm.productDesc}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        productDesc: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="상품 설명을 입력하세요"
                    rows={3}
                    disabled={registering}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상품 이미지
                  </label>
                  <input
                    type="text"
                    value={productForm.productImg}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        productImg: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="이미지 파일명을 입력하세요"
                    disabled={registering}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    가격
                  </label>
                  <input
                    type="number"
                    value={productForm.productPrice}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        productPrice: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="가격을 입력하세요"
                    disabled={registering}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 *
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    disabled={registering}
                  >
                    <option value="">카테고리를 선택하세요</option>
                    <option value="전자제품">전자제품</option>
                    <option value="의류">의류</option>
                    <option value="가구">가구</option>
                    <option value="도서">도서</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    수량
                  </label>
                  <input
                    type="number"
                    value={productForm.productQuantity}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        productQuantity: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    min="1"
                    disabled={registering}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    태그
                  </label>
                  <input
                    type="text"
                    onKeyDown={handleTagInput}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="태그를 입력하고 Enter를 누르세요"
                    disabled={registering}
                  />
                  {productForm.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {productForm.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                            type="button"
                            disabled={registering}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상품 상태
                  </label>
                  <select
                    value={productForm.productStatus}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        productStatus: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    disabled={registering}
                  >
                    <option value="AVAILABLE">판매중</option>
                    <option value="SOLD_OUT">품절</option>
                    <option value="DISCONTINUED">단종</option>
                  </select>
                </div>
                <div className="flex items-center mt-2">
                  <input
                    id="sellingAvailable"
                    type="checkbox"
                    checked={productForm.isSellingAvailable}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        isSellingAvailable: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    disabled={registering}
                  />
                  <label htmlFor="sellingAvailable" className="ml-2 text-sm font-medium text-gray-700">
                    판매 가능 여부
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  disabled={registering}
                >
                  취소
                </button>
                <button
                  onClick={handleProductRegister}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                  disabled={registering}
                >
                  {registering ? "등록 중..." : "등록"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
