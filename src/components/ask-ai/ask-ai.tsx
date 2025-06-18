/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from "react";
import { RiSparkling2Fill } from "react-icons/ri";
import { GrSend } from "react-icons/gr";
import classNames from "classnames";
import { toast } from "sonner";
import { useLocalStorage, useUpdateEffect } from "react-use";
import { ChevronDown } from "lucide-react";

import Login from "../login/login";
import { defaultHTML } from "../../../utils/consts";
import SuccessSound from "./../../assets/success.mp3";
import Settings from "../settings/settings";
import ProModal from "../pro-modal/pro-modal";
import { Button } from "../ui/button";
// @ts-expect-error not needed
import { MODELS } from "./../../../utils/providers";

function AskAI({
  html,
  setHtml,
  onScrollToBottom,
  isAiWorking,
  setisAiWorking,
  onNewPrompt,
  onSuccess,
}: {
  html: string;
  setHtml: (html: string) => void;
  onScrollToBottom: () => void;
  isAiWorking: boolean;
  onNewPrompt: (prompt: string) => void;
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
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg ring-[5px] focus-within:ring-sky-500/50 ring-transparent z-10 absolute bottom-3 left-3 w-[calc(100%-20px)] group">
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
      <div
        className={classNames(
          "w-full relative flex items-center justify-between pl-3.5 p-2 lg:p-2 lg:pl-4",
          {
            "animate-pulse": isAiWorking,
          }
        )}
      >
        {isAiWorking && (
          <div className="absolute bg-neutral-800 rounded-lg bottom-0 left-11 w-[calc(100%-92px)] h-full z-1 flex items-center justify-start max-lg:text-sm">
            <p className="text-neutral-400 font-code">
              AI is {isThinking ? "thinking" : "coding"}...
            </p>
          </div>
        )}
        <RiSparkling2Fill className="size-5 text-neutral-400 group-focus-within:text-sky-500" />
        <input
          type="text"
          disabled={isAiWorking}
          className="w-full bg-transparent max-lg:text-sm outline-none px-3 text-white placeholder:text-neutral-400 font-code"
          placeholder={hasAsked ? "Ask AI for edits" : "Ask AI anything..."}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              callAi();
            }
          }}
        />
        <div className="flex items-center justify-end gap-2">
          {/* <SpeechPrompt setPrompt={setPrompt} /> */}
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
            variant="pink"
            size="icon"
            disabled={isAiWorking || !prompt.trim()}
            onClick={callAi}
          >
            <GrSend className="-translate-x-[1px]" />
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
