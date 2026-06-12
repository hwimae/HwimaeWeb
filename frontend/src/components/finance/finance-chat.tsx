"use client";

import Image from "next/image";
import React, { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { StatusMessage } from "../ui/status-message";
import { sendFinanceChatMessage, startFinanceChat, uploadFinanceInvoice } from "../../lib/finance-api";
import type { FinanceChatMessageResponse, FinanceInvoiceProcessResponse } from "../../types/finance";
import { formatFinanceMoney } from "./finance-format";
import { buildPendingExpenseSummary, getAssistantMessage } from "./finance-chat-message";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  imagePreview?: string;
  extractedExpense?: FinanceChatMessageResponse["extractedExpense"];
  savedExpense?: FinanceChatMessageResponse["savedExpense"];
  budgetWarning?: string | null;
  advice?: string | null;
  askingConfirmation?: boolean;
  interrupted?: boolean;
};

type FinanceChatErrorState = {
  kind: "session" | "send";
  message: string;
};

type FinanceChatRetrySubmission = {
  content: string;
  draftValue: string;
  imageFile: File | null;
  imagePreview: string | null;
  messageType: "text" | "image";
  pendingExpense: FinanceChatMessageResponse["extractedExpense"];
  uploadedInvoice: FinanceInvoiceProcessResponse | null;
  userMessage: ChatMessage;
};

function buildSavedExpenseMessage(expense: NonNullable<FinanceChatMessageResponse["savedExpense"]>): string {
  const merchant = expense.merchantName ?? expense.description ?? "khoản chi mới";
  return `Đã lưu ${merchant} với số tiền ${formatFinanceMoney(expense.amount)}.`;
}

export function getFinanceChatRetryAction(sessionId: string | null): "load-session" | "retry-send" {
  return sessionId === null ? "load-session" : "retry-send";
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function FinanceChat() {
  const mountedRef = useRef(true);
  const messageIdRef = useRef(0);
  const imageReadIdRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingExpense, setPendingExpense] = useState<FinanceChatMessageResponse["extractedExpense"]>(null);
  const [retrySubmission, setRetrySubmission] = useState<FinanceChatRetrySubmission | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<FinanceChatErrorState | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadSession = useCallback(async (signal?: AbortSignal) => {
    setIsStarting(true);
    setError(null);

    try {
      const session = await startFinanceChat({ sessionTitle: `Finance Chat - ${new Date().toLocaleString("vi-VN")}` }, { signal });
      if (!mountedRef.current) return;

      setSessionId(session.sessionId);
      setPendingExpense(null);
      setRetrySubmission(null);
      setMessages([{ id: "initial", role: "assistant", content: session.initialMessage }]);
    } catch (error) {
      if (isAbortError(error) || !mountedRef.current) return;

      setSessionId(null);
      setPendingExpense(null);
      setRetrySubmission(null);
      setMessages([]);
      setError({
        kind: "session",
        message: error instanceof Error ? error.message : "Không thể khởi tạo chat tài chính.",
      });
    } finally {
      if (mountedRef.current) {
        setIsStarting(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadSession(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadSession]);

  function clearImage() {
    imageReadIdRef.current += 1;
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleImageSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      clearImage();
      setError({ kind: "send", message: "Vui lòng chọn file ảnh hóa đơn." });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      clearImage();
      setError({ kind: "send", message: "Kích thước file không được vượt quá 10MB." });
      return;
    }

    const readId = imageReadIdRef.current + 1;
    imageReadIdRef.current = readId;
    setError(null);
    setSelectedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (imageReadIdRef.current === readId) {
        setImagePreview(typeof reader.result === "string" ? reader.result : null);
      }
    };
    reader.readAsDataURL(file);
  }

  async function submitMessage(submission: FinanceChatRetrySubmission, appendUserMessage: boolean) {
    if (!sessionId || isSending) return;

    if (appendUserMessage) {
      setMessages((current) => [...current, submission.userMessage]);
    }

    setIsSending(true);
    setError(null);
    setRetrySubmission(submission);

    let uploadedInvoice = submission.uploadedInvoice;

    try {
      if (submission.messageType === "image" && submission.imageFile && !uploadedInvoice) {
        uploadedInvoice = await uploadFinanceInvoice(submission.imageFile);
        if (!mountedRef.current) return;

        setRetrySubmission((current) => (current ? { ...current, uploadedInvoice } : current));
      }

      const response = await sendFinanceChatMessage(sessionId, submission.content, {
        messageType: submission.messageType,
        isConfirmationResponse: submission.pendingExpense !== null,
        pendingExpense: uploadedInvoice?.pendingExpense ?? submission.pendingExpense,
      });

      if (!mountedRef.current) return;

      const assistantMessage: ChatMessage = {
        id: `assistant-${messageIdRef.current++}`,
        role: "assistant",
        content: getAssistantMessage(response),
        extractedExpense: response.extractedExpense,
        savedExpense: response.savedExpense,
        budgetWarning: response.budgetWarning,
        advice: response.advice,
        askingConfirmation: response.askingConfirmation,
        interrupted: response.interrupted,
      };

      setMessages((current) => [...current, assistantMessage]);
      setDraft("");
      setPendingExpense(response.requiresConfirmation ? response.extractedExpense : null);
      setRetrySubmission(null);
      clearImage();
    } catch (error) {
      if (!mountedRef.current) return;

      setRetrySubmission({ ...submission, uploadedInvoice });
      setDraft(submission.draftValue);
      setError({
        kind: "send",
        message: error instanceof Error ? error.message : "Không thể gửi tin nhắn.",
      });
    } finally {
      if (mountedRef.current) {
        setIsSending(false);
      }
    }
  }

  async function handleRetry() {
    if (getFinanceChatRetryAction(sessionId) === "load-session") {
      await loadSession();
      return;
    }

    if (!retrySubmission) {
      return;
    }

    await submitMessage(retrySubmission, false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    const hasContent = content.length > 0 || selectedImage !== null;
    if (!hasContent || !sessionId || isSending) return;

    const messageType = selectedImage ? "image" : "text";
    const messageContent = selectedImage ? content || `Ảnh hóa đơn: ${selectedImage.name}` : content;
    const submission: FinanceChatRetrySubmission = {
      content: messageContent,
      imageFile: selectedImage,
      imagePreview,
      messageType,
      pendingExpense,
      uploadedInvoice: null,
      draftValue: draft,
      userMessage: {
        id: `user-${messageIdRef.current++}`,
        role: "user",
        content: messageContent,
        imagePreview: imagePreview ?? undefined,
      },
    };

    await submitMessage(submission, true);
  }

  const isReady = sessionId !== null && !isStarting;
  const retryAction = getFinanceChatRetryAction(sessionId);

  return (
    <section className="section-stack">
      <header className="card section-stack">
        <h2>Chat AI tài chính</h2>
        <p>Hỏi trợ lý về chi tiêu, hóa đơn, ngân sách và các gợi ý tài chính cá nhân.</p>
      </header>

      {isStarting && messages.length === 0 ? <StatusMessage>Đang khởi tạo phiên chat...</StatusMessage> : null}
      {pendingExpense ? <StatusMessage>Đang chờ xác nhận: {buildPendingExpenseSummary(pendingExpense)}</StatusMessage> : null}
      {error ? (
        <StatusMessage tone="error">
          <div className="section-stack">
            <p>{error.message}</p>
            <div>
              <button type="button" onClick={() => void handleRetry()} disabled={retryAction === "load-session" ? isStarting : isSending || !retrySubmission}>
                {retryAction === "load-session" ? (isStarting ? "Đang thử lại..." : "Thử lại") : isSending ? "Đang gửi lại..." : "Gửi lại"}
              </button>
              <button type="button" onClick={() => setError(null)} disabled={isStarting || isSending}>
                Đóng
              </button>
            </div>
          </div>
        </StatusMessage>
      ) : null}

      <section className="card section-stack" aria-label="Lịch sử chat tài chính">
        <h3>Hội thoại</h3>
        <div className="chat-log" role="log" aria-live="polite" aria-relevant="additions text">
          {messages.map((message) => (
            <article key={message.id} className={`chat-message chat-message-${message.role}`}>
              <header>
                <strong>{message.role === "assistant" ? "AI" : "Bạn"}</strong>
              </header>
              <p>{message.content}</p>

              {message.imagePreview ? (
                <Image src={message.imagePreview} alt="Ảnh hóa đơn đã chọn" width={240} height={160} unoptimized style={{ height: "auto" }} />
              ) : null}
              {message.extractedExpense ? <p className="muted">Tóm tắt khoản chi: {buildPendingExpenseSummary(message.extractedExpense)}</p> : null}
              {message.savedExpense ? <p className="status-message status-message-success">{buildSavedExpenseMessage(message.savedExpense)}</p> : null}
              {message.budgetWarning ? <p className="status-message status-message-error">{message.budgetWarning}</p> : null}
              {message.advice ? <p className="muted">{message.advice}</p> : null}
              {message.askingConfirmation || message.interrupted ? <p className="muted">Vui lòng xác nhận để lưu khoản chi.</p> : null}
            </article>
          ))}
        </div>
      </section>

      {imagePreview ? (
        <section className="card section-stack" aria-label="Xem trước hóa đơn">
          <h3>Ảnh hóa đơn đã chọn</h3>
          <Image src={imagePreview} alt="Xem trước hóa đơn" width={240} height={160} unoptimized style={{ height: "auto" }} />
          <div>
            <button type="button" onClick={clearImage}>
              Xóa ảnh
            </button>
          </div>
        </section>
      ) : null}

      <form className="card section-stack" onSubmit={handleSubmit}>
        <label htmlFor="finance-chat-message">Tin nhắn</label>
        <textarea
          id="finance-chat-message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ví dụ: Tôi vừa uống cà phê 25k ở Highlands"
          rows={4}
          disabled={!isReady}
        />

        <label htmlFor="finance-chat-image">Ảnh hóa đơn</label>
        <input id="finance-chat-image" ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} disabled={!isReady} />

        <div>
          <button type="submit" disabled={!isReady || isSending || (draft.trim().length === 0 && selectedImage === null)}>
            {isSending ? "Đang gửi..." : pendingExpense ? "Gửi xác nhận" : "Gửi"}
          </button>
        </div>
      </form>
    </section>
  );
}
