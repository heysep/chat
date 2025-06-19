import React, { useState, useEffect } from "react";

const STATUS_MAP = {
  PENDING: { label: "대기중", className: "bg-yellow-100 text-yellow-800" },
  PROCESSING: { label: "진행중", className: "bg-blue-100 text-blue-800" },
  CONFIRMED: { label: "확인됨", className: "bg-indigo-100 text-indigo-800" },
  COMPLETED: { label: "완료", className: "bg-green-100 text-green-800" },
  CANCELLED: { label: "취소됨", className: "bg-red-100 text-red-800" },
};

const TransactionManagement = ({ user, onLogout }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all"); // all, buying, selling
  const [statusFilter, setStatusFilter] = useState("all"); // all, PENDING, CONFIRMED, COMPLETED, CANCELLED

  const BASE_URL = "http://localhost:8080/api";

  const handleUnauthorized = () => {
    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
    onLogout();
  };

  // 거래 목록 조회
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // 구매 거래와 판매 거래를 병렬로 조회
      const [purchasesResponse, salesResponse] = await Promise.all([
        fetch(`${BASE_URL}/transactions/my/purchases`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }),
        fetch(`${BASE_URL}/transactions/my/sales`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        })
      ]);

      console.log("구매 거래 응답 상태:", purchasesResponse.status);
      console.log("판매 거래 응답 상태:", salesResponse.status);

      // 401 에러 체크
      if (purchasesResponse.status === 401 || salesResponse.status === 401) {
        handleUnauthorized();
        return;
      }

              // 구매 거래 데이터 처리 (내가 구매자인 거래)
        let purchaseTransactions = [];
        if (purchasesResponse.ok) {
          const purchaseData = await purchasesResponse.json();
          console.log("=== 구매 거래 원본 데이터 ===", purchaseData);
          purchaseTransactions = Array.isArray(purchaseData) ? purchaseData : Array.isArray(purchaseData.data) ? purchaseData.data : [];
          purchaseTransactions = purchaseTransactions.map(t => {
            console.log("구매 거래 개별 데이터:", t);
            console.log("구매 거래 모든 키:", Object.keys(t));
            console.log("구매 거래 ID 필드들:", {
              transactionIdx: t.transactionIdx,
              transaction_idx: t.transaction_idx,
              transactionId: t.transactionId,
              transaction_id: t.transaction_id,
              id: t.id
            });
            console.log("구매 거래 상품 ID 필드들:", {
              productIdx: t.productIdx,
              product_idx: t.product_idx,
              productId: t.productId,
              product_id: t.product_id
            });
            return {...t, transactionType: 'BUYING'};
          });
          console.log("구매 거래 처리 완료:", purchaseTransactions.length, "건");
        } else {
          console.error("구매 거래 조회 실패:", purchasesResponse.status);
        }

              // 판매 거래 데이터 처리 (내가 판매자인 거래)
        let salesTransactions = [];
        if (salesResponse.ok) {
          const salesData = await salesResponse.json();
          console.log("=== 판매 거래 원본 데이터 ===", salesData);
          salesTransactions = Array.isArray(salesData) ? salesData : Array.isArray(salesData.data) ? salesData.data : [];
          salesTransactions = salesTransactions.map(t => {
            console.log("판매 거래 개별 데이터:", t);
            console.log("판매 거래 모든 키:", Object.keys(t));
            console.log("판매 거래 ID 필드들:", {
              transactionIdx: t.transactionIdx,
              transaction_idx: t.transaction_idx,
              transactionId: t.transactionId,
              transaction_id: t.transaction_id,
              id: t.id
            });
            console.log("판매 거래 상품 ID 필드들:", {
              productIdx: t.productIdx,
              product_idx: t.product_idx,
              productId: t.productId,
              product_id: t.product_id
            });
            return {...t, transactionType: 'SELLING'};
          });
          console.log("판매 거래 처리 완료:", salesTransactions.length, "건");
        } else {
          console.error("판매 거래 조회 실패:", salesResponse.status);
        }

      // 모든 거래 합치기
      const allTransactions = [...purchaseTransactions, ...salesTransactions];
      
      console.log("전체 거래 개수:", allTransactions.length);
      console.log("구매 거래:", purchaseTransactions.length, "건");
      console.log("판매 거래:", salesTransactions.length, "건");

      setTransactions(allTransactions);
      setError(null);

    } catch (err) {
      console.error("거래 목록 조회 실패:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // 거래 필터링
  const getFilteredTransactions = () => {
    let filtered = transactions;

    // 구매/판매 필터
    if (activeFilter === "buying") {
      filtered = filtered.filter(t => t.transactionType === 'BUYING');
    } else if (activeFilter === "selling") {
      filtered = filtered.filter(t => t.transactionType === 'SELLING');
    }

    // 상태 필터
    if (statusFilter !== "all") {
      filtered = filtered.filter(t => (t.status || t.transaction_status) === statusFilter);
    }

    return filtered;
  };

  // 거래 유형 확인
  const getTransactionType = (transaction) => {
    return transaction.transactionType === 'BUYING' ? "구매" : "판매";
  };

  // 거래 상대방 정보 표시
  const getCounterpartInfo = (transaction) => {
    const buyerName = transaction.buyerName || transaction.buyer_name || "구매자";
    const sellerName = transaction.sellerName || transaction.seller_name || "판매자";
    
    if (transaction.transactionType === 'BUYING') {
      return `판매자: ${sellerName}`;
    } else {
      return `구매자: ${buyerName}`;
    }
  };

  // 가격 포맷팅
  const formatPrice = (price) => {
    if (typeof price === "number") {
      return `${price.toLocaleString()}원`;
    }
    return price || "가격 정보 없음";
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "날짜 정보 없음";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return dateString;
    }
  };

  // 채팅방 생성 함수
  const createChatRoom = async (transactionIdx, buyerUserIdx, sellerUserIdx, productIdx) => {
    try {
      console.log("=== 채팅방 생성 시도 ===");
      console.log("전달받은 파라미터:", {
        transactionIdx,
        buyerUserIdx,
        sellerUserIdx,
        productIdx
      });

      // 파라미터 검증
      if (!transactionIdx) {
        console.error("❌ transactionIdx가 없습니다:", transactionIdx);
        return;
      }
      if (!buyerUserIdx) {
        console.error("❌ buyerUserIdx가 없습니다:", buyerUserIdx);
        return;
      }
      if (!sellerUserIdx) {
        console.error("❌ sellerUserIdx가 없습니다:", sellerUserIdx);
        return;
      }
      if (!productIdx) {
        console.error("❌ productIdx가 없습니다:", productIdx);
        return;
      }

      // ChatRoomRequestDto에 맞는 필드 순서로 데이터 생성
      const chatRoomData = {
        transactionIdx: Number(transactionIdx),
        buyerUserIdx: Number(buyerUserIdx),
        productIdx: Number(productIdx),
        sellerUserIdx: Number(sellerUserIdx)
      };

      console.log("📤 채팅방 생성 API 호출:");
      console.log("- URL:", `${BASE_URL}/chatroom/create`);
      console.log("- 데이터:", JSON.stringify(chatRoomData, null, 2));

      const response = await fetch(`${BASE_URL}/chatroom/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(chatRoomData),
      });

      console.log("📥 채팅방 생성 응답:");
      console.log("- 상태 코드:", response.status);
      console.log("- 상태 텍스트:", response.statusText);

      if (response.status === 401) {
        console.log("❌ 채팅방 생성 시 인증 오류");
        return;
      }

      if (!response.ok) {
        let errorText;
        let errorData;
        
        try {
          errorText = await response.text();
          // JSON 파싱 시도
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            // JSON이 아닌 경우 텍스트 그대로 사용
            errorData = { message: errorText };
          }
        } catch (e) {
          errorText = "응답을 읽을 수 없습니다";
          errorData = { message: errorText };
        }

        console.error("❌ 채팅방 생성 실패:");
        console.error("- 상태 코드:", response.status);
        console.error("- 상태 텍스트:", response.statusText);
        console.error("- 오류 응답 (텍스트):", errorText);
        console.error("- 오류 응답 (파싱):", errorData);
        console.error("- 전송한 데이터:", chatRoomData);
        
        // 400 오류인 경우 상세 분석
        if (response.status === 400) {
          console.error("🔍 400 BAD REQUEST 상세 분석:");
          console.error("- 요청 URL:", `${BASE_URL}/chatroom/create`);
          console.error("- Content-Type:", "application/json");
          console.error("- 데이터 형식:", typeof chatRoomData);
          console.error("- 각 필드 값과 타입:", {
            transactionIdx: { value: transactionIdx, type: typeof transactionIdx },
            buyerUserIdx: { value: buyerUserIdx, type: typeof buyerUserIdx },
            productIdx: { value: productIdx, type: typeof productIdx },
            sellerUserIdx: { value: sellerUserIdx, type: typeof sellerUserIdx }
          });
          console.error("- JSON 직렬화된 데이터:", JSON.stringify(chatRoomData));
          
          // 백엔드 에러 메시지가 있다면 출력
          if (errorData.message) {
            console.error("- 백엔드 에러 메시지:", errorData.message);
            alert(`채팅방 생성 실패: ${errorData.message}`);
          }
        }
        return;
      }

      const chatRoomResult = await response.json();
      console.log("✅ 채팅방 생성 성공:", chatRoomResult);
      
    } catch (err) {
      console.error("❌ 채팅방 생성 중 예외 오류:", err);
      console.error("- 오류 메시지:", err.message);
      console.error("- 오류 스택:", err.stack);
    }
  };

  // 거래 승인 함수 (판매자가 거래를 승인하여 PROCESSING 상태로 변경)
  const processTransaction = async (transaction) => {
    try {
      const transactionId = transaction.transactionIdx || transaction.transaction_idx || transaction.transactionId || transaction.transaction_id || transaction.id;
      
      console.log("거래 승인 시도:", transactionId);

      const response = await fetch(`${BASE_URL}/transactions/${transactionId}/process`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`거래 승인 실패: ${response.status} - ${errorText}`);
        alert(`거래 승인 실패: ${errorText}`);
        return;
      }

      const result = await response.json();
      console.log("거래 승인 성공:", result);

      // 거래 승인 성공 시 채팅방 생성
      console.log("=== 거래 승인 후 채팅방 생성 준비 ===");
      console.log("거래 데이터 전체:", transaction);
      console.log("거래 데이터의 모든 키:", Object.keys(transaction));
      
      const buyerUserIdx = transaction.buyerUserIdx || transaction.buyer_user_idx;
      const sellerUserIdx = transaction.sellerUserIdx || transaction.seller_user_idx;
      const productIdx = transaction.productIdx || transaction.product_idx;
      
      console.log("추출된 ID들:", {
        transactionId,
        buyerUserIdx,
        sellerUserIdx,
        productIdx
      });

      if (transactionId && buyerUserIdx && sellerUserIdx && productIdx) {
        console.log("✅ 모든 필수 데이터가 있어서 채팅방 생성 시도");
        await createChatRoom(transactionId, buyerUserIdx, sellerUserIdx, productIdx);
      } else {
        console.error("❌ 채팅방 생성에 필요한 데이터가 부족:");
        console.error("- transactionId:", transactionId);
        console.error("- buyerUserIdx:", buyerUserIdx);
        console.error("- sellerUserIdx:", sellerUserIdx);
        console.error("- productIdx:", productIdx);
      }

      alert("거래가 승인되었습니다! 채팅방이 생성됩니다.");
      
      // 거래 목록 새로고침
      fetchTransactions();

    } catch (err) {
      console.error("거래 승인 중 오류:", err);
      alert(`거래 승인 실패: ${err.message}`);
    }
  };

  // 거래 거부 함수
  const rejectTransaction = async (transaction) => {
    try {
      const transactionId = transaction.transactionIdx || transaction.transaction_idx || transaction.transactionId || transaction.transaction_id || transaction.id;
      
      console.log("거래 거부 시도:", transactionId);

      const response = await fetch(`${BASE_URL}/transactions/${transactionId}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`거래 거부 실패: ${response.status} - ${errorText}`);
        alert(`거래 거부 실패: ${errorText}`);
        return;
      }

      const result = await response.json();
      console.log("거래 거부 성공:", result);

      alert("거래가 거부되었습니다.");
      
      // 거래 목록 새로고침
      fetchTransactions();

    } catch (err) {
      console.error("거래 거부 중 오류:", err);
      alert(`거래 거부 실패: ${err.message}`);
    }
  };

  // 거래 완료 함수
  const completeTransaction = async (transaction) => {
    try {
      const transactionId = transaction.transactionIdx || transaction.transaction_idx || transaction.transactionId || transaction.transaction_id || transaction.id;
      
      console.log("거래 완료 시도:", transactionId);

      const response = await fetch(`${BASE_URL}/transactions/${transactionId}/complete`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`거래 완료 실패: ${response.status} - ${errorText}`);
        alert(`거래 완료 실패: ${errorText}`);
        return;
      }

      const result = await response.json();
      console.log("거래 완료 성공:", result);

      alert("거래가 완료되었습니다.");
      
      // 거래 목록 새로고침
      fetchTransactions();

    } catch (err) {
      console.error("거래 완료 중 오류:", err);
      alert(`거래 완료 실패: ${err.message}`);
    }
  };

  // 거래 취소 함수
  const cancelTransaction = async (transaction) => {
    try {
      const transactionId = transaction.transactionIdx || transaction.transaction_idx || transaction.transactionId || transaction.transaction_id || transaction.id;
      
      console.log("거래 취소 시도:", transactionId);

      const response = await fetch(`${BASE_URL}/transactions/${transactionId}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`거래 취소 실패: ${response.status} - ${errorText}`);
        alert(`거래 취소 실패: ${errorText}`);
        return;
      }

      const result = await response.json();
      console.log("거래 취소 성공:", result);

      alert("거래가 취소되었습니다.");
      
      // 거래 목록 새로고침
      fetchTransactions();

    } catch (err) {
      console.error("거래 취소 중 오류:", err);
      alert(`거래 취소 실패: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 overflow-y-auto">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">거래 관리</h2>
        <button
          onClick={fetchTransactions}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          disabled={loading}
        >
          {loading ? "새로고침 중..." : "새로고침"}
        </button>
      </div>

      {/* 필터 버튼들 */}
      <div className="mb-4 space-y-3">
        {/* 거래 유형 필터 */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            전체 거래
          </button>
          <button
            onClick={() => setActiveFilter("buying")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === "buying"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            내가 구매한 거래
          </button>
          <button
            onClick={() => setActiveFilter("selling")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === "selling"
                ? "bg-purple-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            내가 판매한 거래
          </button>
        </div>

        {/* 상태 필터 */}
        <div className="flex space-x-2 flex-wrap">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            모든 상태
          </button>
          {Object.entries(STATUS_MAP).map(([status, config]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === status
                  ? config.className
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          거래 목록을 불러오는 중...
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {getFilteredTransactions().map((transaction) => {
              const transactionType = getTransactionType(transaction);
              const status = transaction.status || transaction.transaction_status || "PENDING";
              const statusConfig = STATUS_MAP[status] || { label: status, className: "bg-gray-100 text-gray-800" };

              return (
                <div
                  key={transaction.transactionIdx || transaction.transaction_idx || transaction.transactionId || transaction.transaction_id || transaction.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          transactionType === "구매"
                            ? "bg-green-100 text-green-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {transactionType}
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusConfig.className}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      거래 ID: {transaction.transactionIdx || transaction.transaction_idx || transaction.transactionId || transaction.transaction_id || transaction.id || "ID 없음"}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {transaction.productTitle || transaction.product_title || "상품 제목 없음"}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {getCounterpartInfo(transaction)}
                      </p>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>수량: {transaction.quantity || transaction.transaction_quantity || 0}개</div>
                        <div>단가: {formatPrice(transaction.productPrice || transaction.product_price)}</div>
                        <div className="font-semibold text-blue-600">
                          총액: {formatPrice((transaction.productPrice || transaction.product_price || 0) * (transaction.quantity || transaction.transaction_quantity || 0))}
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <div>요청일: {formatDate(transaction.createdAt || transaction.created_at)}</div>
                      {transaction.updatedAt || transaction.updated_at ? (
                        <div>수정일: {formatDate(transaction.updatedAt || transaction.updated_at)}</div>
                      ) : null}
                      <div className="text-xs text-gray-500 mt-3">
                        상품 ID: {transaction.productIdx || transaction.product_idx || transaction.productId || transaction.product_id || "ID 없음"}
                      </div>
                    </div>
                  </div>

                  {transaction.notes && (
                    <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{transaction.notes}</p>
                    </div>
                  )}

                  {/* 거래 상태별 액션 버튼들 */}
                  {transaction.transactionType === 'SELLING' && (
                    <>
                      {/* PENDING 상태: 승인/거부 */}
                      {(transaction.status || transaction.transaction_status) === 'PENDING' && (
                        <div className="mt-4 pt-4 border-t flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              processTransaction(transaction);
                            }}
                            className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                          >
                            승인 (채팅방 생성)
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              rejectTransaction(transaction);
                            }}
                            className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                          >
                            거부
                          </button>
                        </div>
                      )}
                      
                      {/* PROCESSING 상태: 완료/취소 */}
                      {(transaction.status || transaction.transaction_status) === 'PROCESSING' && (
                        <div className="mt-4 pt-4 border-t flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              completeTransaction(transaction);
                            }}
                            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                          >
                            거래 완료
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelTransaction(transaction);
                            }}
                            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                          >
                            거래 취소
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* 구매자도 PROCESSING 상태에서 취소 가능 */}
                  {transaction.transactionType === 'BUYING' && 
                   (transaction.status || transaction.transaction_status) === 'PROCESSING' && (
                    <div className="mt-4 pt-4 border-t">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelTransaction(transaction);
                        }}
                        className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                        거래 취소
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {getFilteredTransactions().length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {activeFilter === "all" 
                ? "거래 내역이 없습니다." 
                : activeFilter === "buying" 
                ? "구매한 거래가 없습니다."
                : "판매한 거래가 없습니다."}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionManagement; 