/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from "react";
import classNames from "classnames";
import { toast } from "sonner";
import { useLocalStorage, useUpdateEffect } from "react-use";
import { ArrowUp, ChevronDown } from "lucide-react";
import { FaStopCircle } from "react-icons/fa";

import Login from "../login/login";
import { defaultHTML } from "../../../utils/consts";
import SuccessSound from "./../../assets/success.mp3";
import Settings from "../settings/settings";
import ProModal from "../pro-modal/pro-modal";
import { Button } from "../ui/button";
// @ts-expect-error not needed
import { MODELS } from "../../../utils/providers";
import Loading from "../loading/loading";
import { HtmlHistory } from "../../../utils/types";
import InviteFriends from "../invite-friends/invite-friends";

function AskAI({
  html,
  setHtml,
  onScrollToBottom,
  isAiWorking,
  setisAiWorking,
  htmlHistory,
  onNewPrompt,
  onSuccess,
}: {
  html: string;
  setHtml: (html: string) => void;
  onScrollToBottom: () => void;
  isAiWorking: boolean;
  onNewPrompt: (prompt: string) => void;
  htmlHistory?: HtmlHistory[];
  setisAiWorking: React.Dispatch<React.SetStateAction<boolean>>;
  onSuccess: (h: string, p: string, n?: number[][]) => void;
}) {
  const refThink = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [hasAsked, setHasAsked] = useState(false);
  const [previousPrompt, setPreviousPrompt] = useState("");
  const [provider, setProvider] = useLocalStorage("provider", "auto");
  const [model, setModel] = useLocalStorage("model", MODELS[0].value);
  const [openProvider, setOpenProvider] = useState(false);
  const [providerError, setProviderError] = useState("");
  const [openProModal, setOpenProModal] = useState(false);
  const [think, setThink] = useState<string | undefined>(undefined);
  const [openThink, setOpenThink] = useState(false);
  const [isThinking, setIsThinking] = useState(true);
  const [controller, setController] = useState<AbortController | null>(null);

  const audio = new Audio(SuccessSound);
  audio.volume = 0.5;

  const callAi = async () => {
  if (isAiWorking || !prompt.trim()) return;
  setisAiWorking(true);
  setProviderError("");
  setThink("");
  setOpenThink(false);
  setIsThinking(true);

  const audio = new Audio(SuccessSound);
  audio.volume = 0.5;

  let contentResponse = "";

  const isFollowUp = html !== defaultHTML;
  const abortController = new AbortController();
  setController(abortController);

  try {
    onNewPrompt(prompt);

    const request = await fetch("/api/ask-ai", {
      method: isFollowUp ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        provider,
        ...(isFollowUp ? { previousPrompt, html } : { model }),
      }),
      signal: abortController.signal,
    });

    if (!request.ok) {
      const res = await request.json();
      if (res.openLogin) setOpen(true);
      else if (res.openSelectProvider) {
        setOpenProvider(true);
        setProviderError(res.message);
      } else if (res.openProModal) setOpenProModal(true);
      else toast.error(res.message);
      setisAiWorking(false);
      return;
    }

    const reader = request.body?.getReader();
    const decoder = new TextDecoder("utf-8");
    if (!reader) throw new Error("No readable response body");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      contentResponse += decoder.decode(value, { stream: true });
    }

    const fullHtml = contentResponse.match(/<!DOCTYPE html>[\s\S]*<\/html>/)?.[0] ?? contentResponse;
    setHtml(fullHtml);
    toast.success("AI responded successfully");
    setPreviousPrompt(prompt);
    setPrompt("");
    setisAiWorking(false);
    setHasAsked(true);
    onSuccess(fullHtml, prompt);
    audio.play();
  } catch (error: any) {
    setisAiWorking(false);
    toast.error(error.message || "Something went wrong.");
    if (error.openLogin) setOpen(true);
  }
};

          read();
        }
      }
    } catch (error: any) {
      setisAiWorking(false);
      toast.error(error.message);
      if (error.openLogin) {
        setOpen(true);
      }
    }
  };

  const stopController = () => {
    if (controller) {
      controller.abort();
      setController(null);
      setisAiWorking(false);
      setThink("");
      setOpenThink(false);
      setIsThinking(false);
      if (htmlHistory && htmlHistory?.length > 0) {
        const lastHtml = htmlHistory[htmlHistory.length - 1].html;
        setHtml(lastHtml);
        toast.info("AI generation stopped, reverted to last HTML");
      } else {
        setHtml(defaultHTML);
        toast.info("AI generation stopped");
      }
    }
  };

  useUpdateEffect(() => {
    if (refThink.current) {
      refThink.current.scrollTop = refThink.current.scrollHeight;
    }
  }, [think]);

  useUpdateEffect(() => {
    if (!isThinking) {
      setOpenThink(false);
    }
  }, [isThinking]);

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-2xl ring-[4px] focus-within:ring-neutral-500/30 focus-within:border-neutral-600 ring-transparent z-10 absolute bottom-3 left-3 w-[calc(100%-20px)] group">
      {think && (
        <div className="w-full border-b border-neutral-700 relative overflow-hidden">
          <header
            className="flex items-center justify-between px-5 py-2.5 group hover:bg-neutral-600/20 transition-colors duration-200 cursor-pointer"
            onClick={() => {
              setOpenThink(!openThink);
            }}
          >
            <p className="text-sm font-medium text-neutral-300 group-hover:text-neutral-200 transition-colors duration-200">
              {isThinking ? "AI is thinking..." : "AI's plan"}
            </p>
            <ChevronDown
              className={classNames(
                "size-4 text-neutral-400 group-hover:text-neutral-300 transition-all duration-200",
                {
                  "rotate-180": openThink,
                }
              )}
            />
          </header>
          <main
            ref={refThink}
            className={classNames(
              "overflow-y-auto transition-all duration-200 ease-in-out",
              {
                "max-h-[0px]": !openThink,
                "min-h-[250px] max-h-[250px] border-t border-neutral-700":
                  openThink,
              }
            )}
          >
            <p className="text-[13px] text-neutral-400 whitespace-pre-line px-5 pb-4 pt-3">
              {think}
            </p>
          </main>
        </div>
      )}
      <div className="w-full relative flex items-center justify-between">
        {isAiWorking && (
          <div className="absolute bg-neutral-800 rounded-lg bottom-0 left-4 w-[calc(100%-30px)] h-full z-1 flex items-center justify-between max-lg:text-sm">
            <div className="flex items-center justify-start gap-2">
              <Loading overlay={false} className="!size-4" />
              <p className="text-neutral-400 text-sm">
                AI is {isThinking ? "thinking" : "coding"}...{" "}
              </p>
            </div>
            <div
              className="text-xs text-neutral-400 px-1 py-0.5 rounded-md border border-neutral-600 flex items-center justify-center gap-1.5 bg-neutral-800 hover:brightness-110 transition-all duration-200 cursor-pointer"
              onClick={stopController}
            >
              <FaStopCircle />
              Stop generation
            </div>
          </div>
        )}
        <input
          type="text"
          disabled={isAiWorking}
          className="w-full bg-transparent text-sm outline-none text-white placeholder:text-neutral-400 p-4"
          placeholder={
            hasAsked ? "Ask DeepSite for edits" : "Ask DeepSite anything..."
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              callAi();
            }
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-2 px-4 pb-3">
        <div className="flex-1">
          <InviteFriends />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Settings
            provider={provider as string}
            model={model as string}
            onChange={setProvider}
            onModelChange={setModel}
            open={openProvider}
            error={providerError}
            onClose={setOpenProvider}
          />
          <Button
            size="iconXs"
            disabled={isAiWorking || !prompt.trim()}
            onClick={callAi}
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </div>
      <div
        className={classNames(
          "h-screen w-screen bg-black/20 fixed left-0 top-0 z-10",
          {
            "opacity-0 pointer-events-none": !open,
          }
        )}
        onClick={() => setOpen(false)}
      ></div>
      <div
        className={classNames(
          "absolute top-0 -translate-y-[calc(100%+8px)] right-0 z-10 w-80 border border-neutral-800 !bg-neutral-900 rounded-lg shadow-lg transition-all duration-75 overflow-hidden",
          {
            "opacity-0 pointer-events-none": !open,
          }
        )}
      >
        <Login html={html}>
          <p className="text-gray-500 text-sm mb-3">
            You reached the limit of free AI usage. Please login to continue.
          </p>
        </Login>
      </div>
      <ProModal
        html={html}
        open={openProModal}
        onClose={() => setOpenProModal(false)}
      />
    </div>
  );
}

export default AskAI;
