import { supabase } from "@/lib/supabase";
import { statusLabelToDb } from "@/lib/brothers/tecnico-data";

/**
 * Fila local de confirmações (com assinatura) que não puderam ser enviadas
 * por falta/instabilidade de conexão — tanto conclusão de OS quanto
 * finalização de equipamento. A assinatura em si é só um desenho (funciona
 * offline); o que pode falhar é o envio pro Supabase. Guardamos no
 * localStorage do aparelho e tentamos de novo quando a conexão voltar — não
 * é um PWA completo (a tela ainda precisa ter carregado antes), mas resolve
 * sinal fraco/instável na hora de concluir.
 */
export type ConfirmacaoInput =
  | { tipo: "os"; osId: string; statusLabel: string; servicoRealizado: string; assinaturaDataUrl: string }
  | { tipo: "equipamento"; equipamentoId: string; assinaturaDataUrl: string };

export type PendingConfirmacao = ConfirmacaoInput & { id: string; criadoEm: string };

const KEY = "brothers_pending_confirmacoes";

export function listPendingConfirmacoes(): PendingConfirmacao[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function savePendingConfirmacoes(list: PendingConfirmacao[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function queueConfirmacao(item: ConfirmacaoInput): void {
  const list = listPendingConfirmacoes();
  list.push({ ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, criadoEm: new Date().toISOString() });
  savePendingConfirmacoes(list);
}

/** Envia (ou reenvia) uma confirmação com assinatura: upload da imagem + update do registro. */
export async function enviarConfirmacao(item: ConfirmacaoInput): Promise<void> {
  const alvoId = item.tipo === "os" ? item.osId : item.equipamentoId;
  const blob = await (await fetch(item.assinaturaDataUrl)).blob();
  const path = `${alvoId}/${Date.now()}.png`;
  const { error: uploadError } = await supabase.storage.from("assinaturas").upload(path, blob, { contentType: "image/png" });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from("assinaturas").getPublicUrl(path);

  if (item.tipo === "os") {
    const payload: Record<string, any> = {
      status: statusLabelToDb(item.statusLabel),
      servico_realizado: item.servicoRealizado,
      confirmado_cliente: true,
      confirmado_por: "assinatura_tecnico",
      confirmado_em: new Date().toISOString(),
      assinatura_url: publicUrlData.publicUrl,
    };
    if (item.statusLabel === "Resolvido") payload.data_saida = new Date().toISOString();

    const { error } = await supabase.from("ordens_servico").update(payload).eq("id", item.osId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("equipamentos")
      .update({
        confirmado_cliente: true,
        confirmado_por: "assinatura_tecnico",
        confirmado_em: new Date().toISOString(),
        assinatura_url: publicUrlData.publicUrl,
      })
      .eq("id", item.equipamentoId);
    if (error) throw error;
  }
}

let flushing = false;

/** Tenta enviar tudo que está pendente na fila local. Silencioso — chame de tempos em tempos. */
export async function flushPendingConfirmacoes(): Promise<{ ok: number; falhou: number }> {
  if (flushing) return { ok: 0, falhou: 0 };
  flushing = true;
  let ok = 0;
  let falhou = 0;
  try {
    const pendentes = listPendingConfirmacoes();
    const restantes: PendingConfirmacao[] = [];
    for (const item of pendentes) {
      try {
        await enviarConfirmacao(item);
        ok++;
      } catch (err) {
        console.error("Falha ao sincronizar confirmação pendente:", err);
        restantes.push(item);
        falhou++;
      }
    }
    savePendingConfirmacoes(restantes);
  } finally {
    flushing = false;
  }
  return { ok, falhou };
}
