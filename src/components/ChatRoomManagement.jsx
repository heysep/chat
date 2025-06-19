import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ChatRoomManagement = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const BASE_URL = "http://localhost:8080/api";

  const handleUnauthorized = () => {
    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
    onLogout();
  };

  // 내 거래 목록을 기반으로 채팅방 정보 조회
  const fetchChatRooms = async () => {
    setLoading(true);
    try {
      // 내 전체 거래 목록 조회
      const transactionsResponse = await fetch(`${BASE_URL}/transactions/my`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (transactionsResponse.status === 401) {
        handleUnauthorized();
        return;
      }

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        console.log("거래 데이터:", transactionsData);
        
        const transactions = Array.isArray(transactionsData) ? transactionsData : 
                           Array.isArray(transactionsData.data) ? transactionsData.data : [];

        console.log("✅ 거래 목록 조회 성공:");
        console.log("- 전체 거래 개수:", transactions.length);
        
        if (transactions.length === 0) {
          console.log("⚠️ 거래 데이터가 없습니다. 채팅방을 생성할 수 없습니다.");
        }

        // 거래별로 채팅방 정보 생성
        const chatRoomData = transactions.map(transaction => {
          console.log("=== 거래 데이터 상세 분석 ===", transaction);
          console.log("모든 키:", Object.keys(transaction));
          console.log("가능한 거래 ID 필드들:", {
            transactionId: transaction.transactionId,
            transaction_id: transaction.transaction_id,
            id: transaction.id,
            transaction_idx: transaction.transaction_idx,
            idx: transaction.idx,
            transactionIdx: transaction.transactionIdx
          });
          
          // 백엔드 DTO 구조에 맞게 Idx 접미사 우선 시도
          const transactionId = transaction.transactionIdx || transaction.transaction_idx || transaction.transactionId || transaction.transaction_id || transaction.id || transaction.idx;
          const productId = transaction.productIdx || transaction.product_idx || transaction.productId || transaction.product_id;
          const productTitle = transaction.productTitle || transaction.product_title || transaction.productName || transaction.product_name || transaction.title || "상품명 없음";
          
          // 거래 상대방 정보 - Idx 접미사 우선 시도
          const buyerId = transaction.buyerUserIdx || transaction.buyer_user_idx || transaction.buyerId || transaction.buyer_id || transaction.buyer_idx || transaction.buyerIdx;
          const sellerId = transaction.sellerUserIdx || transaction.seller_user_idx || transaction.sellerId || transaction.seller_id || transaction.seller_idx || transaction.sellerIdx;
          const buyerName = transaction.buyerName || transaction.buyer_name || transaction.buyerUserName || transaction.buyer_user_name || "구매자";
          const sellerName = transaction.sellerName || transaction.seller_name || transaction.sellerUserName || transaction.seller_user_name || "판매자";
          
          console.log("추출된 ID들:", { transactionId, productId, buyerId, sellerId });
          console.log("추출된 이름들:", { buyerName, sellerName, productTitle });
          
          // 내가 구매자인지 판매자인지 확인
          const currentUserId = user.user_idx;
          const isBuyer = buyerId === currentUserId;
          const counterpartName = isBuyer ? sellerName : buyerName;
          const counterpartId = isBuyer ? sellerId : buyerId;
          
          // 필수 데이터 검증
          if (!transactionId) {
            console.warn("⚠️ 거래 ID가 없는 데이터:", transaction);
            return null; // 이 거래는 건너뛰기
          }
          
          if (!buyerId || !sellerId) {
            console.warn("⚠️ 구매자/판매자 ID가 없는 데이터:", { buyerId, sellerId, transaction });
            return null; // 이 거래는 건너뛰기
          }
          
          const chatRoomData = {
            transactionId,
            productId,
            productTitle,
            counterpartName,
            counterpartId,
            myRole: isBuyer ? "구매자" : "판매자",
            status: transaction.status || transaction.transaction_status || "PENDING",
            createdAt: transaction.createdAt || transaction.created_at || transaction.requestDate || transaction.request_date,
            // 채팅방 ID는 실제로는 서버에서 생성되지만, 임시로 거래ID 사용
            chatRoomId: `${transactionId}_${productId || 'unknown'}_${Math.min(buyerId, sellerId)}_${Math.max(buyerId, sellerId)}`
          };
          
          console.log("✅ 생성된 채팅방 데이터:", chatRoomData);
          return chatRoomData;
        }).filter(room => room !== null); // null 값들 제거

        console.log("최종 채팅방 목록:", chatRoomData);
        setChatRooms(chatRoomData);
        setError(null);
      } else {
        console.error("❌ 거래 목록 조회 실패:");
        console.error("- 상태 코드:", transactionsResponse.status);
        console.error("- 상태 텍스트:", transactionsResponse.statusText);
        console.error("- API URL:", `${BASE_URL}/transactions/my`);
        
        // 에러 응답 본문 읽기 시도
        try {
          const errorResponse = await transactionsResponse.text();
          console.error("- 응답 본문:", errorResponse);
        } catch (readError) {
          console.error("- 응답 본문 읽기 실패:", readError);
        }
        
        setError(`거래 목록을 불러올 수 없습니다. (${transactionsResponse.status})`);
      }

    } catch (err) {
      console.error("채팅방 목록 조회 실패:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 채팅방 입장
  const enterChatRoom = async (chatRoomInfo) => {
    console.log("채팅방 입장 시도:", chatRoomInfo);
    
    if (!chatRoomInfo.chatRoomId) {
      console.log("채팅방이 없어서 새로 생성합니다.");
      await createChatRoom(chatRoomInfo);
    } else {
      console.log("기존 채팅방으로 이동:", chatRoomInfo.chatRoomId);
      navigate(`/chatroom/${chatRoomInfo.chatRoomId}`);
    }
  };

  // 채팅방 생성
  const createChatRoom = async (chatRoomInfo) => {
    try {
      console.log("=== 채팅방 생성 시도 ===");
      console.log("채팅방 정보:", chatRoomInfo);
      
      const requestBody = {
        transactionId: chatRoomInfo.transactionId,
        productId: chatRoomInfo.productId,
        participantId: chatRoomInfo.counterpartId,
        title: `${chatRoomInfo.productTitle} 거래 채팅방`
      };
      
      console.log("전송할 데이터:", requestBody);
      console.log("API URL:", `${BASE_URL}/chatroom/create`);

      // 백엔드 DTO에 맞게 요청 데이터 수정
      const currentUserId = user.user_idx;
      const isBuyer = chatRoomInfo.myRole === "구매자";
      
      const backendRequestBody = {
        transactionIdx: chatRoomInfo.transactionId,
        buyerUserIdx: isBuyer ? currentUserId : chatRoomInfo.counterpartId,
        sellerUserIdx: isBuyer ? chatRoomInfo.counterpartId : currentUserId,
        productIdx: chatRoomInfo.productId
      };
      
      console.log("채팅방 생성 요청 데이터:", {
        현재사용자ID: currentUserId,
        내역할: chatRoomInfo.myRole,
        구매자여부: isBuyer,
        거래상대방ID: chatRoomInfo.counterpartId,
        요청데이터: backendRequestBody
      });

      const createResponse = await fetch(`${BASE_URL}/chatroom/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(backendRequestBody),
      });

      console.log("채팅방 생성 응답 상태:", createResponse.status);
      console.log("채팅방 생성 응답 헤더:", Object.fromEntries(createResponse.headers.entries()));

      if (createResponse.status === 401) {
        console.error("채팅방 생성 실패: 인증 오류 (401)");
        handleUnauthorized();
        return;
      }

      if (createResponse.ok) {
        const newChatRoom = await createResponse.json();
        console.log("✅ 채팅방 생성 성공:", newChatRoom);
        
        // 생성된 채팅방으로 바로 이동
        const chatRoomIdx = newChatRoom.chatRoomIdx;
        if (chatRoomIdx) {
          console.log("생성된 채팅방 ID:", chatRoomIdx);
          console.log("채팅방으로 이동합니다...");
          
          // 채팅방 페이지로 이동
          navigate(`/chatroom/${chatRoomIdx}`);
        } else {
          console.error("채팅방 ID를 받지 못했습니다:", newChatRoom);
          alert("채팅방이 생성되었지만 입장할 수 없습니다.");
        }
      } else {
        // 에러 응답 본문 읽기
        let errorMessage = "알 수 없는 오류";
        try {
          const errorResponse = await createResponse.text();
          console.error("❌ 채팅방 생성 실패 응답 본문:", errorResponse);
          
          // JSON 파싱 시도
          try {
            const errorJson = JSON.parse(errorResponse);
            errorMessage = errorJson.message || errorJson.error || errorResponse;
            console.error("파싱된 에러 메시지:", errorMessage);
          } catch (parseError) {
            errorMessage = errorResponse;
            console.error("JSON 파싱 실패, 원본 응답 사용:", errorResponse);
          }
        } catch (readError) {
          console.error("에러 응답 읽기 실패:", readError);
        }
        
        console.error("❌ 채팅방 생성 실패:");
        console.error("- 상태 코드:", createResponse.status);
        console.error("- 상태 텍스트:", createResponse.statusText);
        console.error("- 에러 메시지:", errorMessage);
        console.error("- 요청 데이터:", requestBody);
        
        alert(`채팅방 생성에 실패했습니다.\n상태: ${createResponse.status}\n메시지: ${errorMessage}`);
      }

    } catch (err) {
      console.error("❌ 채팅방 생성 중 네트워크 오류:", err);
      console.error("오류 상세:", {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      alert(`채팅방 생성 중 오류가 발생했습니다.\n오류: ${err.message}`);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "날짜 정보 없음";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return dateString;
    }
  };

  // 거래 상태 표시
  const getStatusDisplay = (status) => {
    const statusMap = {
      PENDING: { label: "대기중", className: "bg-yellow-100 text-yellow-800" },
      PROCESSING: { label: "진행중", className: "bg-blue-100 text-blue-800" },
      COMPLETED: { label: "완료", className: "bg-green-100 text-green-800" },
      CANCELLED: { label: "취소", className: "bg-red-100 text-red-800" },
    };
    
    return statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
  };

  useEffect(() => {
    fetchChatRooms();
  }, [navigate]);

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 overflow-y-auto">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">채팅방 관리</h2>
        <button
          onClick={fetchChatRooms}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          disabled={loading}
        >
          {loading ? "새로고침 중..." : "새로고침"}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          채팅방 목록을 불러오는 중...
        </div>
      ) : chatRooms.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.681L3 21l2.319-5.094A7.96 7.96 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
            </svg>
          </div>
          <p>아직 채팅방이 없습니다.</p>
          <p className="text-sm mt-1">거래가 시작되면 채팅방이 생성됩니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {chatRooms.map((chatRoom) => {
            const statusConfig = getStatusDisplay(chatRoom.status);
            
            return (
              <div
                key={chatRoom.chatRoomId}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all cursor-pointer"
                onClick={() => enterChatRoom(chatRoom)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      chatRoom.myRole === "구매자" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-purple-100 text-purple-800"
                    }`}>
                      {chatRoom.myRole}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusConfig.className}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(chatRoom.createdAt)}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.681L3 21l2.319-5.094A7.96 7.96 0 113 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {chatRoom.productTitle}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {chatRoom.myRole === "구매자" ? "판매자" : "구매자"}: {chatRoom.counterpartName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      거래 ID: {chatRoom.transactionId}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatRoomManagement; 