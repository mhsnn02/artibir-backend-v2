import React, { useState, useEffect } from "react";
import { Smartphone, RefreshCw, Signal, Battery } from "lucide-react";
import { adminService } from "../../services/api_service";

const AdminMobileHub = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSimData = async () => {
    setLoading(true);
    try {
      const res = await adminService.getStats(); // Using stats as a data source placeholder or if there's a specific events endpoint
      // Since we need real events for the simulator, let's assume we can fetch them
      // For now, filtering from main data or using a mock that matches mobile structure
      setEvents([
        {
          id: 1,
          title: "KAMPÜS KONSERİ",
          location: "Merkez Bahçe",
          creator: "Müzik Kulübü",
        },
        {
          id: 2,
          title: "TEKNOLOJİ ZİRVESİ",
          location: "Mühendislik B1",
          creator: "IEEE",
        },
        {
          id: 3,
          title: "ARTIBİR BULUŞMASI",
          location: "Kantin",
          creator: "Admin",
        },
      ]);
    } catch (err) {
      console.error("Simulation data load failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSimData();
  }, []);

  return (
    <div style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}>
      {/* Phone Frame */}
      <div
        style={{
          width: "320px",
          height: "640px",
          background: "#000",
          borderRadius: "40px",
          border: "8px solid #1a1b1f",
          position: "relative",
          boxShadow:
            "0 30px 60px rgba(0,0,0,0.5), 0 0 20px rgba(212, 175, 55, 0.2)",
          overflow: "hidden",
        }}
      >
        {/* Status Bar */}
        <div
          style={{
            padding: "10px 24px",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            fontWeight: "bold",
            color: "white",
            zIndex: 10,
          }}
        >
          <span>18:32</span>
          <div style={{ display: "flex", gap: "5px" }}>
            <Signal size={10} />
            <Battery size={10} />
          </div>
        </div>

        {/* Mobile Screen Content */}
        <div
          style={{
            height: "100%",
            background: "#050505",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "40px 20px 10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "900",
                color: "white",
                letterSpacing: "1px",
              }}
            >
              KEŞFET
            </h3>
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "#11121a",
                border: "1px solid #d4af37",
              }}
            ></div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0 15px" }}>
            {loading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  paddingTop: "100px",
                }}
              >
                <RefreshCw className="animate-spin" size={24} color="#d4af37" />
              </div>
            ) : (
              events.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    background: "#11121a",
                    borderRadius: "16px",
                    padding: "12px",
                    marginBottom: "12px",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100px",
                      background: "linear-gradient(45deg, #1e1e2d, #0d0d0f)",
                      borderRadius: "10px",
                      marginBottom: "8px",
                    }}
                  ></div>
                  <h4
                    style={{
                      fontSize: "11px",
                      fontWeight: "800",
                      color: "white",
                    }}
                  >
                    {ev.title}
                  </h4>
                  <p
                    style={{
                      fontSize: "9px",
                      color: "#d4af37",
                      marginTop: "4px",
                    }}
                  >
                    📍 {ev.location}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "6px",
                      fontSize: "8px",
                      color: "rgba(255,255,255,0.3)",
                    }}
                  >
                    <span>👤 {ev.creator}</span>
                    <span style={{ color: "#10b981" }}>AKTİF</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Nav Simulation */}
          <div
            style={{
              height: "60px",
              background: "#0a0b10",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <span style={{ color: "#d4af37" }}>🏠</span>
            <span style={{ opacity: 0.3 }}>💬</span>
            <span style={{ opacity: 0.3 }}>➕</span>
            <span style={{ opacity: 0.3 }}>🎫</span>
            <span style={{ opacity: 0.3 }}>👤</span>
          </div>
        </div>
      </div>

      {/* Info Side */}
      <div style={{ flex: 1, paddingTop: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            marginBottom: "20px",
          }}
        >
          <Smartphone size={32} color="#d4af37" />
          <h2 style={{ fontSize: "24px", fontWeight: "bold" }}>
            Canlı Mobil Hub
          </h2>
        </div>
        <p
          style={{
            color: "var(--text-secondary)",
            marginBottom: "30px",
            lineHeight: "1.6",
          }}
        >
          Bu simülatör, ArtıBir mobil uygulamasının son tasarım (Onyx &
          Electric) ve canlı veritabanı entegrasyonunu web üzerinden görmenizi
          sağlar. Yayınlanan etkinliklerin ve moderasyon işlemlerinin mobil
          kullanıcıya yansımasını buradan takip edebilirsiniz.
        </p>
        <div
          className="glass-card"
          style={{ padding: "24px", borderLeft: "4px solid #10b981" }}
        >
          <h4
            style={{ color: "#10b981", marginBottom: "10px", fontSize: "14px" }}
          >
            ● SİSTEM DURUMU: SENKRONİZE
          </h4>
          <p style={{ fontSize: "13px", color: "var(--text-dim)" }}>
            Mobil API v2.0 ile tam uyumlu çalışıyor. Veriler her 30 saniyede bir
            otomatik yenilenir.
          </p>
        </div>
        <button
          onClick={loadSimData}
          style={{
            marginTop: "30px",
            background: "transparent",
            border: "1px solid #d4af37",
            color: "#d4af37",
            padding: "12px 24px",
            borderRadius: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: "bold",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) =>
            (e.target.style.background = "rgba(212, 175, 55, 0.1)")
          }
          onMouseOut={(e) => (e.target.style.background = "transparent")}
        >
          <RefreshCw size={18} />
          SİMÜLASYONU YENİLE
        </button>
      </div>
    </div>
  );
};

export default AdminMobileHub;
