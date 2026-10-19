/**
 * Helper to translate technical database/system errors into user-friendly messages in Portuguese.
 */
export function getFriendlyErrorMessage(error: any, fallbackMessage: string = "Ocorreu um erro ao processar sua solicitação."): string {
  if (!error) return fallbackMessage;

  const rawMsg = typeof error === "string" ? error : error?.message || error?.details || error?.hint || JSON.stringify(error);
  const lowerMsg = rawMsg.toLowerCase();

  // Database / Foreign key / Unique key error patterns
  if (lowerMsg.includes("foreign key") || lowerMsg.includes("fkey") || lowerMsg.includes("violates foreign key")) {
    if (lowerMsg.includes("patient_id")) {
      return "Não foi possível identificar o perfil de paciente cadastrado. Por favor, verifique seu cadastro.";
    }
    if (lowerMsg.includes("doctor_id")) {
      return "O médico selecionado não foi encontrado ou não está com o cadastro completo no sistema.";
    }
    if (lowerMsg.includes("insurance_id")) {
      return "O plano de saúde selecionado não está mais disponível ou é inválido.";
    }
    if (lowerMsg.includes("location_id")) {
      return "O local ou unidade hospitalar selecionada não foi encontrada.";
    }
    return "Um dos itens selecionados não possui vínculo válido no sistema. Verifique as informações inseridas.";
  }

  if (lowerMsg.includes("duplicate key") || lowerMsg.includes("unique") || lowerMsg.includes("already exists")) {
    if (lowerMsg.includes("email")) {
      return "Este e-mail já está cadastrado no sistema. Tente fazer login ou recupere seu acesso.";
    }
    if (lowerMsg.includes("cpf")) {
      return "Este CPF já está cadastrado para outro usuário no sistema.";
    }
    if (lowerMsg.includes("crm")) {
      return "Este CRM médico já consta em nossa base de dados.";
    }
    if (lowerMsg.includes("name")) {
      return "Já existe um registro cadastrado com este nome.";
    }
    return "Já existe um registro com estes dados em nosso sistema.";
  }

  if (lowerMsg.includes("null value in column") || lowerMsg.includes("violates not-null")) {
    return "Por favor, preencha todos os campos obrigatórios do formulário antes de continuar.";
  }

  if (lowerMsg.includes("insert") || lowerMsg.includes("update") || lowerMsg.includes("pgrst") || lowerMsg.includes("postgres")) {
    return "Não foi possível concluir a gravação dos dados no momento. Por favor, tente novamente em instantes.";
  }

  if (lowerMsg.includes("invalid input syntax") || lowerMsg.includes("uuid")) {
    return "Alguns dados fornecidos possuem formato inválido. Por favor, confira os campos e tente novamente.";
  }

  if (lowerMsg.includes("network") || lowerMsg.includes("fetch") || lowerMsg.includes("failed to fetch")) {
    return "Falha de conexão com os servidores. Por favor, verifique sua internet e tente novamente.";
  }

  // Return rawMsg if it's already a friendly user string (no SQL keywords/technical jargon)
  if (!lowerMsg.includes("insert") && !lowerMsg.includes("update") && !lowerMsg.includes("select") && !lowerMsg.includes("table") && !lowerMsg.includes("column") && !lowerMsg.includes("pgrst")) {
    return rawMsg;
  }

  return fallbackMessage;
}
