# Fuel Up Rewards

Crie um protótipo de aplicativo mobile e um dashboard web de fidelidade white-label para postos de combustíveis. O modelo de negócios não usa cashback, mas sim desconto imediato na bomba aliado a um sistema de gamificação por volume abastecido. O stack de tecnologia preferencial é React, Tailwind CSS e Lucide Icons.

​1. Design System e UI/UX

​Estilo visual: Moderno, minimalista e focado em conversão rápida.

​Cores: Como é um app white-label, utilize um tema base neutro (branco, cinza claro) com uma cor primária vibrante (ex: azul elétrico ou laranja) para representar a "Marca do Posto" nos botões e destaques.

​Tipografia: Sans-serif legível e grande (fácil de ler ao ar livre, no ambiente do posto).

​Responsividade: Foco mobile-first para o aplicativo do motorista e desktop para o painel do gestor.

​2. Telas do Aplicativo do Motorista (Mobile)

​Tela Home: Deve conter uma saudação ao usuário. O foco principal é um card central mostrando o nível atual da gamificação (Ex: "Nível Ouro") e o desconto atual (Ex: "Seu desconto: R$ 0,10 / Litro"). Abaixo, uma barra de progresso visual (Ex: "Faltam 15 litros para o Nível Diamante e ganhar R$ 0,15/L").

​Ação Principal (CTA): Um botão grande e flutuante na tela Home escrito "Abastecer com Desconto".

​Tela de Token (Segurança): Ao clicar no botão principal, abre um modal ou nova tela exibindo um token dinâmico grande (ex: 439 012) e um cronômetro regressivo de 2 minutos. Adicione um texto instrucional: "Informe seu CPF e este código ao frentista".

​Tela de Histórico: Uma lista simples mostrando os últimos abastecimentos (Data, Volume em Litros, Valor Economizado na hora).

​3. Tela do Gestor do Posto (Dashboard Web)

​Sidebar: Menu lateral com "Visão Geral", "Regras de Desconto", "Clientes".

​Visão Geral (Métricas): Cards superiores com dados simulados: "Volume Total Abastecido no Mês", "Total de Descontos Concedidos", e "Novos Clientes Cadastrados".

​Configuração de Tiers: Uma seção mostrando os níveis de gamificação configurados (ex: Nível 1 - 0 a 50L = R$ 0,05; Nível 2 - 51 a 100L = R$ 0,10).

​4. Comportamentos e Mock Data

​Popule a interface com dados falsos (mock data) realistas para que o protótipo não pareça vazio.

​Torne o botão "Abastecer com Desconto" clicável, ativando o cronômetro do token.

​A interface deve transmitir velocidade e confiança. Evite animações muito longas, o foco é a agilidade na pista de abastecimento.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://fuel-boost-pro.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/50974f20-6cd8-4f08-b626-6292eee01826).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
