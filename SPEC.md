# Sistema de uma clínica médica

## Cenário
Nossa aplicação web consiste em um sistema de gerenciamento, agendamento, manutenção de pacientes, horários e consultas e seleção de áreas da saúde específicas.

O sistema possui três áreas distintas, sendo elas: 

1. Área do paciente - onde o usuário poderá utilizar a agenda virtual para marcar seus compromissos com a clínica.
2. Área do funcionário - um espaço no qual os funcionários poderão realizar a organização e a gestão de seus serviços.
3. Área do médico - o ambiente em que os médicos poderão manusear de maneira complexa e facilitadora seus pacientes.
4. Área do admin - onde



## Problemas a serem resolvidos
A maneira de se organizar em compromissos com a sua saúde por meios considerados difíceis de se estruturar, vem sendo um constante problema na sociedade, pois papéis são descartáveis e facilm[...]
  
## Escopo
Criar um sistema para gerenciar as principais áreas que um hospital pode oferecer para seus pacientes e funcionários, através de nossa aplicação

### Requisitos
1. Controle e fluxo de consultas/agendamentos
2. Controle de planos 
3. Controle de hospitais que atendam
4. Controle de prontuários 
5. Seleção de áreas que o paciente necessite 
6. Seleção de doutores (caso o paciente tenha preferências)
7. Será algo mais cotidiano


### O que o sistema não precisa fazer:
  1. Não obteremos a opção de agendamentos cirúrgicos 
  2. E também não teremos agendamentos a longa data, como nutricionistas e psicólogos (rotina)

### Backlog #01 
- Implementar autenticação real com tela de login, substituindo o fallback de usuários demo atual.
- Garantir que a tela inicial apresente a tela de login e não a interface principal sem autenticação.
- Validar antes de inserir uma especialidade para impedir duplicidade e exibir mensagem amigável ao usuário.
- Corrigir o fluxo de agendamento para que os horários disponíveis apareçam corretamente após selecionar médico e data.
- Investigar e corrigir a tela do admin em branco, garantindo o carregamento dos dados de especialidades, locais, convênios e usuários.
- Revisar a consistência dos dados vindos do Supabase para as operações de cadastro e consulta.
