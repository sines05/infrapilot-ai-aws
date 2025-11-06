import React, { useEffect, useState, useRef } from "react";

interface Message {
  t: Date;
  text: string;
}

export default function ApiDemo() {
  const [wsMessages, setWsMessages] = useState<Message[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      setWsMessages((m) => [...m, { t: new Date(), text: "ws open" }]);
    };

    ws.onmessage = (evt: MessageEvent) => {
      try {
        const data = JSON.parse(evt.data);
        setWsMessages((m) => [...m, { t: new Date(), text: JSON.stringify(data) }]);
      } catch {
        setWsMessages((m) => [...m, { t: new Date(), text: evt.data }]);
      }
    };

    ws.onerror = () => {
      setWsMessages((m) => [...m, { t: new Date(), text: "ws error" }]);
    };

    ws.onclose = () => {
      setWsMessages((m) => [...m, { t: new Date(), text: "ws closed" }]);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      <h3>API demo (localhost:8080)</h3>
      <div>
        <h4>WebSocket /ws messages</h4>
        <div style={{ maxHeight: 240, overflow: "auto", background: "#f7f7f7", padding: 8 }}>
          {wsMessages.map((m, i) => (
            <div key={i}>
              <small>{m.t.toLocaleTimeString()}</small>
              <div style={{ fontSize: 12 }}>{m.text}</div>
              <hr />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
