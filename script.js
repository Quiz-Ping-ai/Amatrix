/* =====================================================
   CONFIGURAÇÃO FIREBASE — AMATRIX
====================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyB4CeFeVm7RPyzsAD4L8bvAV7qV8K5nGNg",
    authDomain: "forum2info.firebaseapp.com",
    databaseURL: "https://forum2info-default-rtdb.firebaseio.com",
    projectId: "forum2info",
    storageBucket: "forum2info.firebasestorage.app",
    messagingSenderId: "168240293906",
    appId: "1:168240293906:web:2f7b829125ad48772050cb",
    measurementId: "G-81WJPWKNCG"
};

/* =====================================================
   INICIALIZAÇÃO
====================================================== */

let firebaseReady = false;
let auth = null;
let db = null;

try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    auth = firebase.auth();
    db = firebase.database();

    firebaseReady = true;

    console.log("Firebase inicializado com sucesso!");
} catch (error) {
    console.error("Erro ao inicializar o Firebase:", error);
}
        /* =====================================================
           ESTADO
        ====================================================== */

       let currentUser = null;
       let activityInterval = null;
        let currentTopicId = null;
        let currentCategory = "all";
        // Controle da conexão online
        let activeConnectionRef = null;

        // Estado da área de matérias
        let selectedSubject = null;
        let subjectTopicsData = {};
        let subjectTopicsListenerRef = null;

        /* =====================================================
            AMATRIX — VERIFICAÇÃO DE SUSPENSÃO
        ====================================================== */

async function isCurrentUserSuspended() {
    if (!currentUser || !currentUser.uid || !db) {
        return false;
    }

    try {
        const snapshot = await db
            .ref("suspendedUsers/" + currentUser.uid + "/active")
            .once("value");

        return snapshot.val() === true;

    } catch (error) {
        console.error(
            "[Amatrix] Não foi possível verificar a suspensão:",
            error
        );

        // Se não for possível verificar, não permitir publicar.
        return true;
    }
}


        /* =====================================================
           ELEMENTOS
        ====================================================== */

        const accountModal =
            document.getElementById(
                "accountModal"
            );


        const topicModal =
            document.getElementById(
                "topicModal"
            );


        const viewTopicModal =
            document.getElementById(
                "viewTopicModal"
            );


        const topicsList =
            document.getElementById(
                "topicsList"
            );


        const searchInput =
            document.getElementById(
                "searchInput"
            );


        /* =====================================================
           UTILIDADES
        ====================================================== */

        function escapeHTML(text) {

            if (text === undefined ||
                text === null) {

                return "";

            }


            return String(text)

                .replace(
                    /&/g,
                    "&amp;"
                )

                .replace(
                    /</g,
                    "&lt;"
                )

                .replace(
                    />/g,
                    "&gt;"
                )

                .replace(
                    /"/g,
                    "&quot;"
                )

                .replace(
                    /'/g,
                    "&#039;"
                );

        }


        function showToast(text) {

            const toast =
                document.getElementById(
                    "toast"
                );


            toast.textContent =
                text;


            toast.classList.add(
                "show"
            );


            setTimeout(
                () => {

                    toast.classList.remove(
                        "show"
                    );

                },
                3000
            );

        }


        function showMessage(
            element,
            text,
            error = false
        ) {

            element.innerHTML = `

                <div
                    class="message-box"
                    style="
                    color:${error ? "#b00020" : "var(--pink-dark)"};
                    ">

                    ${escapeHTML(text)}

                </div>

            `;

        }


        /* =====================================================
           NAVEGAÇÃO
        ====================================================== */

        document
            .querySelectorAll(
                ".nav-button"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const page =
                            button.dataset.page;


                        document
                            .querySelectorAll(
                                ".nav-button"
                            )
                            .forEach(btn => {

                                btn.classList.remove(
                                    "active"
                                );

                            });


                        button.classList.add(
                            "active"
                        );


                        document
                            .querySelectorAll(
                                ".page"
                            )
                            .forEach(section => {

                                section.classList.remove(
                                    "active"
                                );

                            });


                        document
                            .getElementById(
                                page + "Page"
                            )
                            .classList.add(
                                "active"
                            );


                        if (
                            page === "forum"
                        ) {

                            renderTopics();

                        }


                        if (
                            page === "members"
                        ) {

                            renderMembers();

                        }

                        if (page === "subjects") {
                            renderSubjectsPage();
                        }

                    }
                );

            });


        /* =====================================================
           MODAL LOGIN
        ====================================================== */

        function openAccountModal() {

            accountModal.classList.add(
                "open"
            );

        }


        function closeAccountModal() {

            accountModal.classList.remove(
                "open"
            );

        }


        document
            .getElementById(
                "profileLoginButton"
            )
            .addEventListener(
                "click",
                openAccountModal
            );


        document
            .getElementById(
                "loginTab"
            )
            .addEventListener(
                "click",
                () => {

                    document
                        .getElementById(
                            "loginTab"
                        )
                        .classList.add(
                            "active"
                        );


                    document
                        .getElementById(
                            "registerTab"
                        )
                        .classList.remove(
                            "active"
                        );


                    document
                        .getElementById(
                            "loginForm"
                        )
                        .style.display =
                        "flex";


                    document
                        .getElementById(
                            "registerForm"
                        )
                        .style.display =
                        "none";

                }
            );


        document
            .getElementById(
                "registerTab"
            )
            .addEventListener(
                "click",
                () => {

                    document
                        .getElementById(
                            "registerTab"
                        )
                        .classList.add(
                            "active"
                        );


                    document
                        .getElementById(
                            "loginTab"
                        )
                        .classList.remove(
                            "active"
                        );


                    document
                        .getElementById(
                            "registerForm"
                        )
                        .style.display =
                        "flex";


                    document
                        .getElementById(
                            "loginForm"
                        )
                        .style.display =
                        "none";

                }
            );


        /* =====================================================
           CADASTRO
        ====================================================== */

        document
            .getElementById(
                "registerForm"
            )
            .addEventListener(
                "submit",
                async event => {

                    event.preventDefault();


                    if (!firebaseReady) {

                        showMessage(

                            document.getElementById(
                                "registerMessage"
                            ),

                            "Configure o Firebase no código primeiro.",

                            true

                        );

                        return;

                    }


                    const email =
                        document
                        .getElementById(
                            "registerEmail"
                        )
                        .value
                        .trim();


                    const password =
                        document
                        .getElementById(
                            "registerPassword"
                        )
                        .value;


                    const nickname =
                        document
                        .getElementById(
                            "registerNickname"
                        )
                        .value
                        .trim();


                    const year =
                        document
                        .getElementById(
                            "registerYear"
                        )
                        .value;


                    if (!year) {

                        showMessage(

                            document.getElementById(
                                "registerMessage"
                            ),

                            "Selecione seu ano escolar.",

                            true

                        );

                        return;

                    }


try {

    const result = await auth.createUserWithEmailAndPassword(
        email,
        password
    );

    const uid = result.user.uid;

    const userData = {
        uid,
        email,
        nickname,
        year,
        accent: "#f32c91",
        background: "#ffd8eb",
        photo: "",
        online: true,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };

    await db
        .ref("users/" + uid)
        .set(userData);

    const snapshot = await db
        .ref("users/" + uid)
        .once("value");

    if (!snapshot.exists()) {
        throw new Error("O perfil não foi encontrado após o cadastro.");
    }

    currentUser = {
    ...snapshot.val(),
    uid
};

applyUser(currentUser);

    showToast("Conta criada! Bem-vindo ao Amatrix ★");

    document.getElementById("registerForm").reset();

    closeAccountModal();

} catch (error) {

    console.error("Erro no cadastro:", error);

    showMessage(
        document.getElementById("registerMessage"),
        firebaseError(error),
        true
    );

}


                }
            );


        /* =====================================================
           LOGIN
        ====================================================== */

        document
            .getElementById(
                "loginForm"
            )
            .addEventListener(
                "submit",
                async event => {

                    event.preventDefault();


                    if (!firebaseReady) {

                        showMessage(

                            document.getElementById(
                                "loginMessage"
                            ),

                            "Configure o Firebase no código primeiro.",

                            true

                        );

                        return;

                    }


                    const email =
                        document
                        .getElementById(
                            "loginEmail"
                        )
                        .value
                        .trim();


                    const password =
                        document
                        .getElementById(
                            "loginPassword"
                        )
                        .value;


                   
try {

    const result = await auth.signInWithEmailAndPassword(
        email,
        password
    );

    const user = result.user;

    const snapshot = await db
        .ref("users/" + user.uid)
        .once("value");

    if (!snapshot.exists()) {

        showMessage(
            document.getElementById("loginMessage"),
            "Sua autenticação foi realizada, mas seu perfil não foi encontrado. Entre em contato com o suporte.",
            true
        );

        return;
    }

    document.getElementById("loginForm").reset();

    closeAccountModal();

    showToast("Login realizado ★");

} catch (error) {

    showMessage(
        document.getElementById("loginMessage"),
        firebaseError(error),
        true
    );

}

                }
            );


/* =====================================================
   RECUPERAR SENHA
====================================================== */

const loginForm = document.getElementById("loginForm");

const forgotPasswordButton = document.createElement("button");

forgotPasswordButton.type = "button";
forgotPasswordButton.textContent = "Esqueci minha senha";

forgotPasswordButton.style.cssText = `
    background: transparent;
    border: none;
    color: var(--pink-dark);
    cursor: pointer;
    font-size: 14px;
    text-decoration: underline;
    padding: 10px;
    margin-top: 5px;
    align-self: center;
`;

const loginSubmitButton = loginForm.querySelector(
    'button[type="submit"], input[type="submit"]'
);

loginForm.insertBefore(
    forgotPasswordButton,
    loginSubmitButton
);

forgotPasswordButton.addEventListener("click", async () => {

    const email = document
        .getElementById("loginEmail")
        .value
        .trim();

    if (!firebaseReady) {
        showMessage(
            document.getElementById("loginMessage"),
            "O serviço de login está indisponível.",
            true
        );
        return;
    }

    if (!email) {
        showMessage(
            document.getElementById("loginMessage"),
            "Digite seu e-mail para receber o link de recuperação.",
            true
        );
        document.getElementById("loginEmail").focus();
        return;
    }

    try {

        await auth.sendPasswordResetEmail(email);

        showMessage(
            document.getElementById("loginMessage"),
            "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha. Verifique também a caixa de spam."
        );

    } catch (error) {

        let message = "Não foi possível enviar o e-mail. Tente novamente.";

        if (error.code === "auth/invalid-email") {
            message = "O endereço de e-mail é inválido.";
        }

        if (error.code === "auth/too-many-requests") {
            message = "Muitas tentativas. Aguarde um pouco e tente novamente.";
        }

        showMessage(
            document.getElementById("loginMessage"),
            message,
            true
        );

    }

});



        function firebaseError(error) {

            const code =
                error.code || "";


            if (
                code.includes(
                    "email-already-in-use"
                )
            ) {

                return "Este e-mail já está cadastrado.";

            }


            if (
                code.includes(
                    "invalid-email"
                )
            ) {

                return "Digite um e-mail válido.";

            }


            if (
                code.includes(
                    "weak-password"
                )
            ) {

                return "A senha precisa ter pelo menos 6 caracteres.";

            }


            if (
                code.includes(
                    "invalid-credential"
                )
            ) {

                return "E-mail ou senha incorretos.";

            }


            return (
                error.message ||
                "Ocorreu um erro."
            );

        }


        /* =====================================================
           AUTENTICAÇÃO
        ====================================================== */

if (firebaseReady) {

    auth.onAuthStateChanged(
        async user => {

            if (!user) {

                currentUser = null;

                if (activityInterval) {
                    clearInterval(activityInterval);
                    activityInterval = null;
                }

                updateNotificationVisibility();
                removeModerationUI();
                updateLoggedOutUI();
                listenSubjectTopics();

                return;
            }

            try {

                let snapshot = await db
    .ref("users/" + user.uid)
    .once("value");

let profile = snapshot.val();

if (!profile) {

    await new Promise(resolve => setTimeout(resolve, 2000));

    snapshot = await db
        .ref("users/" + user.uid)
        .once("value");

    profile = snapshot.val();
}

if (!profile) {

                    currentUser = null;

                    showMessage(
                        document.getElementById("loginMessage"),
                        "Sua conta foi autenticada, mas o perfil não foi encontrado no banco de dados. Entre em contato com o suporte.",
                        true
                    );

                    await auth.signOut();

                    return;
                }

                currentUser = {
                    ...profile,
                    uid: user.uid
                };

                updateNotificationVisibility();

                setupModerationUI();

                applyUser(currentUser);

                setupPresence();

                listenTopics();

                listenSubjectTopics();

                listenMessages();

                listenUsers();

                renderMembers();

                listenNotifications();

            } catch (error) {

                console.error(
                    "Erro ao carregar perfil do usuário:",
                    error
                );

                currentUser = null;

                showMessage(
                    document.getElementById("loginMessage"),
                    "Não foi possível carregar seu perfil. Tente entrar novamente.",
                    true
                );

            }

        }
    );

}



        /* =====================================================
           USUÁRIO LOGADO
        ====================================================== */

        function applyUser(user) {

            document.documentElement
                .style
                .setProperty(
                    "--pink",
                    user.accent ||
                    "#f32c91"
                );


            document.documentElement
                .style
                .setProperty(
                    "--pink-dark",
                    user.accent ||
                    "#c5146b"
                );

            // Cores personalizadas do gradiente
            const gradientStart = user.gradientStart || "#f32c91";
            const gradientEnd = user.gradientEnd || "#8b5cf6";

            document.documentElement.style.setProperty(
                "--gradient-start",
                gradientStart
           );

            document.documentElement.style.setProperty(
             "--gradient-end",
             gradientEnd
            );

                // Mostrar as cores salvas nas configurações
            document.getElementById("settingsGradientStart").value =
             gradientStart;

            document.getElementById("settingsGradientEnd").value =
            gradientEnd;    


            document.body.style
                .background =
                user.background ||
                "#ffd8eb";


            document
                .getElementById(
                    "profileName"
                )
                .textContent =
                user.nickname;


            document
                .getElementById(
                    "profileDescription"
                )
                .textContent =
                user.email +
                " · " +
                user.year +
                " · ★ membro";


            document
                .getElementById(
                    "heroUser"
                )
                .textContent =
                user.nickname +
                " · " +
                user.year;


            document
                .getElementById(
                    "forumYear"
                )
                .textContent =
                "fórum exclusivo · " +
                user.year;


            const avatar =
                document
                .getElementById(
                    "profileAvatar"
                );


            if (user.photo) {

                avatar.innerHTML = `

                    <img
                        src="${user.photo}"
                        alt="Foto de perfil">

                `;

            } else {

                avatar.textContent =
                    user.nickname
                    .charAt(0)
                    .toUpperCase();

            }


            document
                .getElementById(
                    "profileLoginButton"
                )
                .style.display =
                "none";


            document
                .getElementById(
                    "settingsButton"
                )
                .style.display =
                "inline-block";


            document
                .getElementById(
                    "accountButton"
                )
                .textContent =
                user.nickname +
                " · sair";


            document
                .getElementById(
                    "yearCategories"
                )
                .innerHTML = `

                    <div
                        class="category"
                        style="grid-column:1/-1;">

                        <strong>

                            ★ FÓRUM DO
                            ${escapeHTML(
                                user.year
                            ).toUpperCase()}

                        </strong>

                        <small>

                            Este é o único fórum
                            disponível para sua conta.

                            Você pode alterar seu ano
                            nas configurações do perfil.

                        </small>

                    </div>

                `;


            document
                .getElementById(
                    "topicYearNotice"
                )
                .textContent =
                "Seu tópico será publicado somente no fórum do " +
                user.year +
                ".";


            renderTopics();

            renderMembers();

        }


        function updateLoggedOutUI() {

            document
                .getElementById(
                    "accountButton"
                )
                .textContent =
                "entrar / cadastrar";


            document
                .getElementById(
                    "heroUser"
                )
                .textContent =
                "visitante ♡";


            document
                .getElementById(
                    "forumYear"
                )
                .textContent =
                "entre para acessar";


            document
                .getElementById(
                    "profileName"
                )
                .textContent =
                "Visitante";


            document
                .getElementById(
                    "profileDescription"
                )
                .textContent =
                "Entre ou cadastre-se para personalizar seu perfil.";


            document
                .getElementById(
                    "profileLoginButton"
                )
                .style.display =
                "inline-block";


            document
                .getElementById(
                    "settingsButton"
                )
                .style.display =
                "none";


            document
                .getElementById(
                    "profileAvatar"
                )
                .textContent =
                "♡";


            topicsList.innerHTML = `

                <div class="empty">

                    ★ Entre na sua conta
                    para acessar o fórum.

                    <br><br>

                    <button
                        class="pink-button"
                        onclick="openAccountModal()">

                        entrar / cadastrar

                    </button>

                </div>

            `;

        }


        
/* =====================================================
   BOTÃO DA CONTA
   Clique com usuário logado = logout.
====================================================== */

document
    .getElementById("accountButton")
    .addEventListener("click", async () => {

        if (!currentUser) {

            openAccountModal();

            return;

        }

        if (confirm("Deseja sair da sua conta?")) {

            try {

                // Remove a conexão desta aba.
                if (activeConnectionRef) {

                    await activeConnectionRef.remove();

                    activeConnectionRef = null;

                }

                // Encerra a autenticação.
                await auth.signOut();

                showToast(
                    "Você saiu do Amatrix."
                );

            } catch (error) {

                console.error(
                    "Erro ao sair da conta:",
                    error
                );

                showToast(
                    "Não foi possível sair da conta."
                );

            }

        }

    });


        /* =====================================================
           CONFIGURAÇÕES
        ====================================================== */

        document
            .getElementById(
                "settingsButton"
            )
            .addEventListener(
                "click",
                () => {

                    if (!currentUser)
                        return;


                    document
                        .getElementById(
                            "settingsNickname"
                        )
                        .value =
                        currentUser.nickname;


                    document
                        .getElementById(
                            "settingsYear"
                        )
                        .value =
                        currentUser.year;


                    document
                        .getElementById(
                            "settingsAccent"
                        )
                        .value =
                        currentUser.accent ||
                        "#f32c91";


                    document
                        .getElementById(
                            "settingsBackground"
                        )
                        .value =
                        currentUser.background ||
                        "#ffd8eb";


                    document
                        .getElementById(
                            "profileSettings"
                        )
                        .style.display =
                        "block";

                }
            );


        document
            .getElementById(
                "cancelSettings"
            )
            .addEventListener(
                "click",
                () => {

                    document
                        .getElementById(
                            "profileSettings"
                        )
                        .style.display =
                        "none";

                }
            );

            
/* =====================================================
   EXCLUIR CONTA E DADOS DO AMATRIX
===================================================== */

document
    .getElementById("deleteAccountButton")
    .addEventListener("click", async event => {

        const button = event.currentTarget;
        const firebaseUser = auth.currentUser;

        if (!firebaseUser || !currentUser) {
            alert("Entre na sua conta antes de continuar.");
            return;
        }

        if (!firebaseUser.email) {
            alert(
                "Não foi possível identificar o e-mail da conta."
            );
            return;
        }

        const confirmed = confirm(
            "ATENÇÃO: esta ação é permanente!\n\n" +
            "Sua conta, seus tópicos, suas respostas e " +
            "suas curtidas serão excluídos.\n\n" +
            "Deseja realmente continuar?"
        );

        if (!confirmed) return;

        const password = prompt(
            "Para confirmar, digite a senha da sua conta:"
        );

        if (password === null) return;

        if (!password.trim()) {
            alert("Digite sua senha para continuar.");
            return;
        }

        button.disabled = true;
        button.textContent = "excluindo conta...";

        let dataCleanupComplete = false;

        try {
            // Confirma a identidade antes de apagar os dados.
            const credential =
                firebase.auth.EmailAuthProvider.credential(
                    firebaseUser.email,
                    password
                );

            await firebaseUser.reauthenticateWithCredential(
                credential
            );

            const uid = firebaseUser.uid;

            // Carrega os tópicos existentes.
            const topicsSnapshot = await db
                .ref("topics")
                .once("value");

            const topics = topicsSnapshot.val() || {};

            // Percorre todos os tópicos.
            for (const [topicId, topic] of Object.entries(topics)) {

                // Se o tópico pertence à conta que será excluída,
                // apaga suas mensagens, curtidas e o próprio tópico.
                if (topic.authorId === uid) {

                    await db
                        .ref("topicMessages/" + topicId)
                        .remove();

                    await db
                        .ref("messageLikes/" + topicId)
                        .remove();

                    await db
                        .ref("topics/" + topicId)
                        .remove();

                    continue;
                }

                // Em tópicos de outras pessoas, localiza as respostas
                // e curtidas feitas pela conta que será excluída.
                const messagesSnapshot = await db
                    .ref("topicMessages/" + topicId)
                    .once("value");

                const messages = messagesSnapshot.val() || {};

                const likesSnapshot = await db
                    .ref("messageLikes/" + topicId)
                    .once("value");

                const likes = likesSnapshot.val() || {};

                let removedReplies = false;

                for (const [messageId, message] of Object.entries(messages)) {

                    // Remove respostas escritas pela conta.
                    if (message.authorId === uid) {

                        // Remove as curtidas associadas à resposta
                        // antes de apagar a própria resposta.
                        await db
                            .ref(
                                "messageLikes/" +
                                topicId + "/" +
                                messageId
                            )
                            .remove();

                        await db
                            .ref(
                                "topicMessages/" +
                                topicId + "/" +
                                messageId
                            )
                            .remove();

                        removedReplies = true;

                    } else if (
                        likes[messageId] &&
                        likes[messageId][uid] === true
                    ) {

                        // Remove a curtida que essa conta deu.
                        await db
                            .ref(
                                "messageLikes/" +
                                topicId + "/" +
                                messageId + "/" +
                                uid
                            )
                            .remove();
                    }
                }

                // Corrige a quantidade de respostas dos tópicos
                // de outras pessoas que foram afetados.
                if (removedReplies) {

                    const remainingSnapshot = await db
                        .ref("topicMessages/" + topicId)
                        .once("value");

                    const remainingMessages =
                        remainingSnapshot.val() || {};

                    await db
                        .ref("topics/" + topicId + "/replies")
                        .set(Object.keys(remainingMessages).length);
                }
            }

            // Apaga os dados particulares da conta.
            await db
                .ref("subjectTopics/" + uid)
                .remove();

            await db
                .ref("users/" + uid)
                .remove();

            dataCleanupComplete = true;

            // Exclui a conta do Firebase Authentication.
            await firebaseUser.delete();

            alert(
                "Sua conta e os dados associados foram excluídos."
            );

            window.location.reload();

        } catch (error) {

            console.error(
                "Erro ao excluir a conta do Amatrix:",
                error
            );

            if (
                error.code === "auth/wrong-password" ||
                error.code === "auth/invalid-credential"
            ) {

                alert(
                    "A senha está incorreta. Nenhum dado foi " +
                    "apagado se a falha ocorreu na confirmação."
                );

            } else if (
                error.code === "auth/requires-recent-login"
            ) {

                alert(
                    "Por segurança, entre novamente na conta e " +
                    "tente excluir a conta logo após fazer login."
                );

            } else if (dataCleanupComplete) {

                alert(
                    "Os dados do Amatrix foram apagados, mas o " +
                    "Firebase não conseguiu excluir o login. " +
                    "Entre novamente e verifique o console (F12)."
                );

            } else {

                alert(
                    "Não foi possível concluir a exclusão. " +
                    "Pode ser um problema de permissão ou conexão. " +
                    "Confira o console (F12) antes de tentar novamente."
                );
            }

        } finally {

            button.disabled = false;
            button.textContent = "excluir minha conta";
        }
    });



        /* =====================================================
           SALVAR CONFIGURAÇÕES
        ====================================================== */

        document
            .getElementById(
                "settingsForm"
            )
            .addEventListener(
                "submit",
                async event => {

                    event.preventDefault();


                    if (!currentUser)
                        return;


                    const nickname =
                        document
                        .getElementById(
                            "settingsNickname"
                        )
                        .value
                        .trim();


                    const year =
                        document
                        .getElementById(
                            "settingsYear"
                        )
                        .value;


                    const accent =
                        document
                        .getElementById(
                            "settingsAccent"
                        )
                        .value;


                    const background =
                        document
                        .getElementById(
                            "settingsBackground"
                        )
                        .value;

                    const gradientStart =
                        document.getElementById("settingsGradientStart").value;

                    const gradientEnd =
                        document.getElementById("settingsGradientEnd").value;


                    const photoInput =
                        document
                        .getElementById(
                            "settingsPhoto"
                        );


                    if (!nickname) {

                        showMessage(

                            document
                            .getElementById(
                                "settingsMessage"
                            ),

                            "Digite um apelido.",

                            true

                        );

                        return;

                    }


                    async function saveProfile(
                        photo
                    ) {

                        const updated = {

                            ...currentUser,

                            nickname,

                            year,

                            accent,

                            background,

                            gradientStart,

                            gradientEnd,

                            photo:
                                photo !== undefined
                                    ? photo
                                    : currentUser.photo

                        };


                        await db
                            .ref(
                                "users/" +
                                currentUser.uid
                            )
                            .set(
                                updated
                            );


                        currentUser =
                            updated;


                        applyUser(
                            currentUser
                        );


                        document
                            .getElementById(
                                "profileSettings"
                            )
                            .style.display =
                            "none";


                        document
                            .getElementById(
                                "settingsPhoto"
                            )
                            .value =
                            "";


                        showToast(
                            "Perfil atualizado ★"
                        );

                    }


                   const removePhoto = document.getElementById(
    "removeProfilePhoto"
).checked;

if (removePhoto) {

    try {
        await saveProfile("");
    } catch (error) {
        showMessage(
            document.getElementById("settingsMessage"),
            error.message,
            true
        );
    }

    return;
}

if (
    photoInput.files.length
    > 0
) {

                        const file =
                            photoInput.files[0];


                        if (
                            file.size >
                            2 * 1024 * 1024
                        ) {

                            showMessage(

                                document
                                .getElementById(
                                    "settingsMessage"
                                ),

                                "A foto precisa ter no máximo 2 MB.",

                                true

                            );

                            return;

                        }


                        const reader =
                            new FileReader();


                        reader.onload =
                            async () => {

                                try {

                                    await saveProfile(
                                        reader.result
                                    );

                                } catch (error) {

                                    showMessage(

                                        document
                                        .getElementById(
                                            "settingsMessage"
                                        ),

                                        error.message,

                                        true

                                    );

                                }

                            };


                        reader.readAsDataURL(
                            file
                        );

                    } else {

                        try {

                            await saveProfile(
                                undefined
                            );

                        } catch (error) {

                            showMessage(

                                document
                                .getElementById(
                                    "settingsMessage"
                                ),

                                error.message,

                                true

                            );

                        }

                    }

                }
            );


        /* =====================================================
           NOVO TÓPICO
        ====================================================== */

        document
            .getElementById(
                "newTopicButton"
            )
            .addEventListener(
                "click",
                () => {

                    if (!currentUser) {

                        openAccountModal();

                        return;

                    }


                    document
                        .getElementById(
                            "topicYearNotice"
                        )
                        .textContent =
                        "Seu tópico será publicado somente no fórum do " +
                        currentUser.year +
                        ".";

                        editingForumTopicId = "";

                        document.getElementById("topicForm").reset();

                    const submitButton = document.querySelector(
                         '#topicForm button[type="submit"]'
                    );

                    if (submitButton) {
                        submitButton.textContent = "publicar tópico ★";
                    }


                    topicModal.classList.add(
                        "open"
                    );

                }
            );


        function closeTopicModal() {

            topicModal.classList.remove(
                "open"
            );

        }


        document
            .getElementById(
                "closeTopicModal"
            )
            .addEventListener(
                "click",
                closeTopicModal
            );


        document
            .getElementById(
                "cancelTopic"
            )
            .addEventListener(
                "click",
                closeTopicModal
            );


        /* =====================================================
           CRIAR TÓPICO
        ====================================================== */

        // Guarda o ID do tópico do fórum que está sendo editado.
            let editingForumTopicId = "";

        document.getElementById("topicForm").addEventListener(
    "submit",
    async event => {
        event.preventDefault();

        
if (!firebaseReady || !currentUser) {
    showToast("Entre na sua conta primeiro.");
    return;
}

if (await isCurrentUserSuspended()) {
    showToast("Sua conta está suspensa e não pode publicar tópicos.");
    return;
}


        const title = document
            .getElementById("topicTitle")
            .value.trim();

        const description = document
            .getElementById("topicDescription")
            .value.trim();

        const subjectInput = document.getElementById("topicSubject");
        const subject = subjectInput ? subjectInput.value : "";

        if (!title || !description || (subjectInput && !subject)) {
            showToast("Preencha os campos obrigatórios.");
            return;
        }

        const submitButton = document.querySelector(
            '#topicForm button[type="submit"]'
        );

        try {
            if (editingForumTopicId) {
                // EDITAR tópico existente
                const topic = topicsData[editingForumTopicId];

                if (!topic || topic.authorId !== currentUser.uid) {
                    showToast("Você não pode editar este tópico.");
                    return;
                }

                const changes = {
                    title: title,
                    description: description,
                    lastActivity: firebase.database.ServerValue.TIMESTAMP
                };

                if (subjectInput) {
                    changes.subject = subject;
                }

                await db.ref("topics/" + editingForumTopicId).update(changes);

                showToast("Tópico do fórum atualizado ★");

            } else {
                // CRIAR tópico novo
                const topicRef = db.ref("topics").push();

                const topic = {
                    id: topicRef.key,
                    authorId: currentUser.uid,
                    author: currentUser.nickname,
                    year: currentUser.year,
                    title: title,
                    description: description,
                    replies: 0,
                    views: 0,
                    createdAt: firebase.database.ServerValue.TIMESTAMP,
                    lastActivity: firebase.database.ServerValue.TIMESTAMP
                };

                if (subjectInput) {
                    topic.subject = subject;
                }

                await topicRef.set(topic);

                showToast("Tópico publicado ★");
            }

            editingForumTopicId = "";
            document.getElementById("topicForm").reset();

            if (submitButton) {
                submitButton.textContent = "publicar tópico ★";
            }

            closeTopicModal();

        } catch (error) {
            console.error("Erro ao salvar tópico do fórum:", error);
            showToast("Não foi possível salvar. Confira o erro no Console.");
        }
    }
);


        /* =====================================================
           PESQUISA
        ====================================================== */

        searchInput
            .addEventListener(
                "input",
                renderTopics
            );


        /* =====================================================
           LISTENER DOS TÓPICOS
        ====================================================== */

        let topicsData = {};


        
function listenTopics() {
    if (!db || !currentUser) {
        return;
    }

    db.ref("topics").on(
        "value",
        snapshot => {
            topicsData = snapshot.val() || {};

            // Atualiza a lista do Fórum.
           renderTopics();

        subjectTopicsData = {};

        Object.entries(topicsData).forEach(([id, topic]) => {
        if (topic && topic.subject) {
        subjectTopicsData[id] = {
            ...topic,
            id: topic.id || id,
            content: topic.description || topic.content || ""
        };
    }
});

renderSubjectsPage();
        },
        error => {
            console.error("Erro ao carregar tópicos:", error);
            showToast("Não foi possível carregar os tópicos.");
        }
    );
}



        function renderTopics() {

            if (!currentUser) {

                return;

            }


            const search =
                searchInput.value
                .toLowerCase()
                .trim();


            const topics =
                Object
                .values(
                    topicsData
                )
                .filter(topic => {

                    return (
                        topic.year ===
                        currentUser.year
                    );

                })
                .filter(topic => {

                    if (!search)
                        return true;


                    const text = (

                        topic.title +
                        " " +
                        topic.description +
                        " " +
                        topic.author

                    ).toLowerCase();


                    return text.includes(
                        search
                    );

                })
                .sort(
                    (
                        a,
                        b
                    ) =>
                        (b.lastActivity || 0) -
                        (a.lastActivity || 0)
                );


            if (!topics.length) {

                topicsList.innerHTML = `

                    <div class="empty">

                        ★ Nenhum tópico encontrado
                        no fórum do ${escapeHTML(
                            currentUser.year
                        )}.

                        <br><br>

                        Crie o primeiro tópico!

                    </div>

                `;

                return;

            }


            topicsList.innerHTML =
                topics
                .map(topic => {

                    const authorProfile = usersData[topic.authorId] || {};

                    const authorName =
                         authorProfile.nickname ||
                            topic.author ||
                        "Usuário";

                    const authorPhoto = authorProfile.photo || "";

                    const initial = authorName.charAt(0).toUpperCase();

                    return `

                        <article
                            class="topic"
                            onclick="openTopic('${topic.id}')">


                            
                        <div class="avatar">
                            ${authorPhoto
                            ? `<img
                            src="${escapeHTML(authorPhoto)}"
                            alt="Foto de ${escapeHTML(authorName)}"
                            class="topic-avatar-photo">`
                            : escapeHTML(initial)
                            }
                        </div>



                            <div>

                               
<div class="topic-identification">

    <span class="year-tag">
        ${escapeHTML(topic.year)}
    </span>

    <span class="subject-tag">
        ★ ${escapeHTML(topic.subject || "Sem matéria")}
    </span>

    ${topic.authorId === currentUser.uid ? `
        <div class="forum-topic-actions"
             onclick="event.stopPropagation()">

            <button
                type="button"
                class="forum-action-edit"
                onclick="editForumTopic('${topic.id}')">
                editar
            </button>

            <button
                type="button"
                class="forum-action-delete"
                onclick="deleteForumTopic('${topic.id}')">
                excluir
            </button>

        </div>
    ` : ""}

</div>




                                <h3>

                                    ${escapeHTML(
                                        topic.title
                                    )}

                                </h3>

                                <span class="topic-status-tag ${
                                    topic.status === "resolvido" ? "resolved" : "open"
                                }">
                                     ${topic.status === "resolvido" ? "✓ Resolvido" : "● Em aberto"}
                                </span>


                                <p
                                    class="topic-description">

                                    ${escapeHTML(
                                        topic.description
                                    )}

                                </p>

                                <small
                                    style="
                                    font-weight:800;
                                    color:#b51667;
                                    ">

                                    por
                                    ${escapeHTML(
                                        topic.author
                                    )}

                                </small>

                            </div>


                            <div
                                class="topic-meta">

                                💬
                                ${topic.replies || 0}

                                ·

                                👁
                                ${topic.views || 0}

                                <br>

                                ${formatTime(
                                    topic.lastActivity
                                )}

                            </div>


                        </article>

                    `;

                })
                .join("");

        }

            /* =====================================================
   EDITAR TÓPICO DO FÓRUM
====================================================== */

function editForumTopic(topicId) {
    if (!currentUser) {
        openAccountModal();
        return;
    }

    const topic = topicsData[topicId];

    if (!topic || topic.authorId !== currentUser.uid) {
        showToast("Você não pode editar este tópico.");
        return;
    }

    editingForumTopicId = topicId;

    document.getElementById("topicTitle").value = topic.title || "";
    document.getElementById("topicDescription").value =
        topic.description || "";

    const subjectInput = document.getElementById("topicSubject");

    if (subjectInput && topic.subject) {
        subjectInput.value = topic.subject;
    }

    const submitButton = document.querySelector(
        '#topicForm button[type="submit"]'
    );

    if (submitButton) {
        submitButton.textContent = "salvar alterações ★";
    }

    document.getElementById("topicYearNotice").textContent =
        "Você está editando um tópico do fórum do " + topic.year + ".";

    topicModal.classList.add("open");
}


/* =====================================================
   EXCLUIR TÓPICO DO FÓRUM
====================================================== */

async function deleteForumTopic(topicId) {
    if (!currentUser) {
        openAccountModal();
        return;
    }

    const topic = topicsData[topicId];

    if (!topic || topic.authorId !== currentUser.uid) {
        showToast("Você não pode excluir este tópico.");
        return;
    }

    if (!confirm('Deseja excluir o tópico "' + topic.title + '"?')) {
        return;
    }

    try {
        await db.ref("topics/" + topicId).remove();

        if (currentTopicId === topicId) {
            viewTopicModal.classList.remove("open");
            currentTopicId = null;
        }

        showToast("Tópico do fórum excluído ★");

    } catch (error) {
        console.error("Erro ao excluir tópico do fórum:", error);
        showToast("Não foi possível excluir. Confira o erro no Console.");
    }
}

        /* =====================================================
           ABRIR TÓPICO
        ====================================================== */

        async function openTopic(id) {

            if (!currentUser)
                return;


            const topic =
                topicsData[id];


            if (!topic)
                return;


            if (
                topic.year !==
                currentUser.year
            ) {

                showToast(
                    "Você não pode acessar este fórum."
                );

                return;

            }


            currentTopicId =
                id;


            document
                .getElementById(
                    "viewTopicTitle"
                )
                .textContent =
                topic.title;


            document
                .getElementById(
                    "viewTopicContent"
                )
                .innerHTML = `

                    <div class="topic-status-area">
                     <span class="topic-status-tag ${
                         topic.status === "resolvido" ? "resolved" : "open"
                    }">
                         ${topic.status === "resolvido" ? "✓ Resolvido" : "● Em aberto"}
                    </span>

                 ${
                        topic.authorId === currentUser.uid
                    ? `
                <button
                    type="button"
                    class="topic-status-button"
                    onclick="event.stopPropagation(); toggleTopicStatus('${id}')">
                    ${
                        topic.status === "resolvido"
                            ? "Reabrir tópico"
                            : "Marcar como resolvido"
                    }
                </button>
                                 `
                                : ""
                            }
                    </div>

                    <div class="message-box">

                        <strong>
                            ${escapeHTML(
                                topic.author
                            )}
                        </strong>

                        ·

                        ${escapeHTML(
                            topic.year
                        )}

                    </div>

                    <br>

                    <p
                        style="
                        font-weight:700;
                        line-height:1.6;
                        ">

                        ${escapeHTML(
                            topic.description
                        )}

                    </p>

                `;


            viewTopicModal.classList.add(
                "open"
            );

            
            // Botão para denunciar o tópico, quando ele pertence a outra pessoa.
            const topicReportButton = document.createElement("button");

            if (topic.authorId !== currentUser.uid) {
                topicReportButton.type = "button";
                topicReportButton.className = "white-button";
                topicReportButton.textContent = "⚑ Denunciar tópico";
                topicReportButton.style.marginTop = "12px";
                topicReportButton.dataset.reportType = "topic";
                topicReportButton.dataset.reportTarget = id;

                topicReportButton.addEventListener("click", () => {
                    reportContent(
                        "topic",
                        id,
                        id,
                        topic.authorId,
                        topic.author
                    );
                });

                document
                    .getElementById("viewTopicContent")
                    .appendChild(topicReportButton);
            }



            await db
                .ref(
                    "topics/" +
                    id +
                    "/views"
                )
                .transaction(
                    value =>
                        (value || 0) + 1
                );


            loadTopicMessages(
                id
            );

        }

        /* =====================================================
   MARCAR TÓPICO COMO RESOLVIDO OU REABRIR
====================================================== */

async function toggleTopicStatus(topicId) {
    if (!currentUser) {
        openAccountModal();
        return;
    }

    const topic = topicsData[topicId];

    if (!topic || topic.authorId !== currentUser.uid) {
        showToast("Somente o autor pode alterar o status.");
        return;
    }

    const newStatus =
        topic.status === "resolvido" ? "aberto" : "resolvido";

    try {
        await db.ref("topics/" + topicId + "/status").set(newStatus);

        showToast(
            newStatus === "resolvido"
                ? "Tópico marcado como resolvido ★"
                : "Tópico reaberto ★"
        );

        openTopic(topicId);
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        showToast("Não foi possível alterar o status do tópico.");
    }
}


        /* =====================================================
           FECHAR TÓPICO
        ====================================================== */

        document
            .getElementById(
                "closeViewTopic"
            )
            .addEventListener(
                "click",
                () => {

                    viewTopicModal.classList.remove(
                        "open"
                    );

                }
            );


        /* =====================================================
   MENSAGENS E CURTIDAS DAS RESPOSTAS
====================================================== */



let currentMessagesData = {};
let currentMessageLikesData = {};
let currentMessageRepliesData = {};
let currentMessageReplyThreadsData = {};
let messageLikesTopicId = null;

function loadTopicMessages(id) {
    const messagesRef = db.ref("topicMessages/" + id);
    const likesRef = db.ref("messageLikes/" + id);
    const repliesRef = db.ref("messageReplies/" + id);
    const replyThreadsRef = db.ref("messageReplyThreads/" + id);

    messagesRef.off("value");
    likesRef.off("value");
    repliesRef.off("value");
    replyThreadsRef.off("value");

    currentMessagesData = {};
    currentMessageLikesData = {};
    currentMessageRepliesData = {};
    currentMessageReplyThreadsData = {};
    messageLikesTopicId = id;

    messagesRef.on("value", snapshot => {
        currentMessagesData = snapshot.val() || {};
        renderTopicMessagesWithLikes(id);
    }, error => {
        console.error("Erro ao carregar mensagens:", error);
        showToast("Não foi possível carregar as mensagens.");
    });

    likesRef.on("value", snapshot => {
        currentMessageLikesData = snapshot.val() || {};
        renderTopicMessagesWithLikes(id);
    }, error => {
        console.error("Erro ao carregar curtidas:", error);
        showToast("Não foi possível carregar as curtidas.");
    });

    repliesRef.on("value", snapshot => {
        currentMessageRepliesData = snapshot.val() || {};
        renderTopicMessagesWithLikes(id);
    }, error => {
        console.error("Erro ao carregar respostas dos comentários:", error);
        showToast("Não foi possível carregar as respostas.");
    });

    replyThreadsRef.on("value", snapshot => {
        currentMessageReplyThreadsData = snapshot.val() || {};
        renderTopicMessagesWithLikes(id);
    }, error => {
        console.error("Erro ao carregar respostas encadeadas:", error);
        showToast("Não foi possível carregar as respostas encadeadas.");
    });
}


// Renderiza uma resposta e todas as respostas feitas a ela.
function renderNestedMessageReply(topicId, rootMessageId, replyId, reply, depth = 1) {
    const childReplies = Object.entries(currentMessageReplyThreadsData)
        .filter(([childId, child]) => child && child.parentId === replyId)
        .sort((a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0));

    const childrenHTML = childReplies.map(([childId, child]) =>
        renderNestedMessageReply(
            topicId,
            rootMessageId,
            childId,
            child,
            depth + 1
        )
    ).join("");

    const safeReplyId = escapeHTML(replyId);

    return `
        <div class="message nested-message" style="margin-left:${Math.min(depth, 8) * 12}px;">
            <strong>${escapeHTML(reply.author || "Usuário")}:</strong>
            <p>${escapeHTML(reply.text || "")}</p>
            <small>${formatTime(reply.createdAt)}</small>

            <div class="message-like-area">
                <button
                    type="button"
                    class="white-button"
                    onclick="toggleMessageReplyForm('${topicId}', '${safeReplyId}', '${rootMessageId}')"
                    ${!currentUser ? "disabled" : ""}>
                    ↩ Responder
                </button>
            </div>

            <div
                id="messageReplyForm-${safeReplyId}"
                class="message-reply-form"
                style="display:none; margin-top:10px;">

                <textarea
                    id="messageReplyText-${safeReplyId}"
                    placeholder="Responder a ${escapeHTML(reply.author || "este usuário")}..."
                    rows="3"></textarea>

                <button
                    type="button"
                    class="pink-button"
                    onclick="sendMessageReply('${topicId}', '${safeReplyId}', '${rootMessageId}')">
                    Enviar resposta ★
                </button>

                <button
                    type="button"
                    class="white-button"
                    onclick="toggleMessageReplyForm('${topicId}', '${safeReplyId}', '${rootMessageId}')">
                    Cancelar
                </button>
            </div>

            <div class="nested-replies">
                ${childrenHTML}
            </div>
        </div>
    `;
}


function renderTopicMessagesWithLikes(topicId) {
    const container = document.getElementById("topicMessages");

    if (!container || messageLikesTopicId !== topicId) {
        return;
    }

    const list = Object.entries(currentMessagesData)
        .map(([messageId, message]) => ({
            ...message,
            messageId
        }))
        .sort((a, b) =>
            (a.createdAt || 0) - (b.createdAt || 0)
        );

    if (!list.length) {
        container.innerHTML = `
            <div class="empty">
                Nenhuma mensagem ainda. Seja a primeira! ★
            </div>
        `;
        return;
    }

    container.innerHTML = list.map(message => {
        const likes = currentMessageLikesData[message.messageId] || {};

        const likeCount = Object.values(likes)
            .filter(value => value === true).length;

        const userLiked = !!(
            currentUser &&
            likes[currentUser.uid] === true
        );

        const replies = currentMessageRepliesData[message.messageId] || {};

        const repliesHTML = Object.entries(replies)
            .sort((a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0))
            .map(([replyId, reply]) =>
                renderNestedMessageReply(
                    topicId,
                    message.messageId,
                    replyId,
                    reply,
                    1
                )
            ).join("");

        return `
            <div class="message">

                <strong>${escapeHTML(message.author || "Usuário")}:</strong>

                <p>${escapeHTML(message.text || "")}</p>

                <small>${formatTime(message.createdAt)}</small>

                <div class="message-like-area">

                    <button
                        type="button"
                        class="message-like-button ${userLiked ? "liked" : ""}"
                        onclick="toggleMessageLike('${topicId}', '${message.messageId}')"
                        ${!currentUser ? "disabled" : ""}
                        aria-pressed="${userLiked}">
                        ${userLiked ? "♥ Curtido" : "♡ Curtir"}
                        (${likeCount})
                    </button>

                    <button
                        type="button"
                        class="white-button"
                        onclick="toggleMessageReplyForm('${topicId}', '${message.messageId}', '${message.messageId}')"
                        ${!currentUser ? "disabled" : ""}>
                        ↩ Responder
                    </button>

                    ${currentUser && message.authorId !== currentUser.uid ? `
                        <button
                            type="button"
                            class="white-button"
                            onclick="reportContent('message', '${topicId}', '${message.messageId}')">
                            ⚑ Denunciar
                        </button>
                    ` : ""}

                </div>

                <div
                    id="messageReplyForm-${message.messageId}"
                    class="message-reply-form"
                    style="display:none; margin-top:12px;">

                    <textarea
                        id="messageReplyText-${message.messageId}"
                        placeholder="Escreva sua resposta..."
                        rows="3"></textarea>

                    <button
                        type="button"
                        class="pink-button"
                        onclick="sendMessageReply('${topicId}', '${message.messageId}', '${message.messageId}')">
                        Enviar resposta ★
                    </button>

                    <button
                        type="button"
                        class="white-button"
                        onclick="toggleMessageReplyForm('${topicId}', '${message.messageId}', '${message.messageId}')">
                        Cancelar
                    </button>
                </div>

                <div class="nested-replies">
                    ${repliesHTML}
                </div>

            </div>
        `;
    }).join("");
}


// Abre ou fecha o campo de resposta.
function toggleMessageReplyForm(topicId, parentId, rootMessageId) {
    if (!currentUser) {
        openAccountModal();
        return;
    }

    const form = document.getElementById(
        "messageReplyForm-" + parentId
    );

    if (!form) return;

    form.style.display =
        form.style.display === "none" ? "block" : "none";
}


// Localiza o autor da mensagem respondida.
function findMessageReplyParent(topicId, parentId, rootMessageId) {
    if (parentId === rootMessageId) {
        return currentMessagesData[rootMessageId] || null;
    }

    const legacyReply =
        currentMessageRepliesData[rootMessageId] &&
        currentMessageRepliesData[rootMessageId][parentId];

    if (legacyReply) return legacyReply;

    return currentMessageReplyThreadsData[parentId] || null;
}


// Envia uma resposta a um comentário ou a outra resposta.
async function sendMessageReply(topicId, parentId, rootMessageId) {
    if (!currentUser) {
        openAccountModal();
        return;
    }

    if (await isCurrentUserSuspended()) {
        showToast("Sua conta está suspensa e não pode responder.");
        return;
    }

    if (!topicsData[topicId]) {
        showToast("Este tópico não está disponível.");
        return;
    }

    const input = document.getElementById(
        "messageReplyText-" + parentId
    );

    if (!input) return;

    const text = input.value.trim();

    if (!text) {
        showToast("Escreva uma resposta primeiro.");
        return;
    }

    const parent = findMessageReplyParent(
        topicId,
        parentId,
        rootMessageId
    );

    if (!parent) {
        showToast("A mensagem à qual você quer responder não está mais disponível.");
        return;
    }

    const button = input.parentElement.querySelector(
        "button.pink-button"
    );

    if (button) button.disabled = true;

    try {
        const replyData = {
            author: currentUser.nickname || "Usuário",
            authorId: currentUser.uid,
            text: text,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        // Respostas diretas ao comentário continuam no caminho antigo.
        if (parentId === rootMessageId) {
            const ref = db
                .ref(
                    "messageReplies/" +
                    topicId + "/" +
                    rootMessageId
                )
                .push();

            await ref.set(replyData);

        } else {
            // Respostas a outras respostas ficam em uma coleção separada.
            const ref = db
                .ref("messageReplyThreads/" + topicId)
                .push();

            await ref.set({
                ...replyData,
                parentId: parentId,
                rootMessageId: rootMessageId
            });
        }

        input.value = "";
        input.parentElement.style.display = "none";

        showToast("Resposta enviada ★");

        // Notifica o autor da mensagem específica respondida.
        if (
            parent.authorId &&
            parent.authorId !== currentUser.uid
        ) {
            try {
                const notificationRef = db
                    .ref("notifications/" + parent.authorId)
                    .push();

                await notificationRef.set({
                    type: "message_reply",
                    fromUid: currentUser.uid,
                    fromName: currentUser.nickname || "Usuário",
                    text: (currentUser.nickname || "Alguém") +
                        " respondeu à sua mensagem no tópico: " +
                        (topicsData[topicId].title || ""),
                    topicId: topicId,
                    messageId: rootMessageId,
                    parentId: parentId,
                    createdAt: firebase.database.ServerValue.TIMESTAMP,
                    read: false
                });

            } catch (notificationError) {
                console.error(
                    "Resposta salva, mas a notificação falhou:",
                    notificationError
                );
            }
        }

        try {
            await db
                .ref("topics/" + topicId + "/lastActivity")
                .set(firebase.database.ServerValue.TIMESTAMP);
        } catch (activityError) {
            console.error(
                "Não foi possível atualizar a atividade do tópico:",
                activityError
            );
        }

    } catch (error) {
        console.error("Erro ao enviar resposta encadeada:", error);

        showToast(
            "Não foi possível enviar. Verifique sua conexão e as regras do Firebase."
        );

    } finally {
        if (button) button.disabled = false;
    }
}



async function toggleMessageLike(topicId, messageId) {
    if (!currentUser) {
        openAccountModal();
        return;
    }

    if (!topicsData[topicId]) {
        showToast("Este tópico não está disponível.");
        return;
    }

    const likeRef = db.ref(
        "messageLikes/" + topicId + "/" + messageId + "/" + currentUser.uid
    );

    try {
        // Confere se a pessoa já curtiu esta resposta.
        const likeSnapshot = await likeRef.once("value");

        if (likeSnapshot.val() === true) {
            await likeRef.remove();
            return;
        }

        // Busca a resposta que recebeu a curtida.
        const messageSnapshot = await db
            .ref("topicMessages/" + topicId + "/" + messageId)
            .once("value");

        const message = messageSnapshot.val();

        if (!message) {
            showToast("Esta resposta não está mais disponível.");
            return;
        }

        // Registra a curtida.
        await likeRef.set(true);

        // Não notifica a pessoa que curtiu a própria resposta.
        if (
            message.authorId &&
            message.authorId !== currentUser.uid
        ) {
            try {
                const topic = topicsData[topicId];

                const notificationRef = db
                    .ref("notifications/" + message.authorId)
                    .push();

                await notificationRef.set({
                    type: "like",
                    fromUid: currentUser.uid,
                    fromName: currentUser.nickname,
                    text: currentUser.nickname +
                        " curtiu sua resposta" +
                        (topic && topic.title
                            ? " no tópico: " + topic.title
                            : "."),
                    topicId: topicId,
                    messageId: messageId,
                    createdAt:
                        firebase.database.ServerValue.TIMESTAMP,
                    read: false
                });
            } catch (notificationError) {
                console.error(
                    "Curtida registrada, mas a notificação falhou:",
                    notificationError
                );
            }
        }

    } catch (error) {
        console.error("Erro ao atualizar curtida:", error);
        showToast(
            "Não foi possível atualizar a curtida. Verifique as regras do Firebase."
        );
    }
}


/* =====================================================
   DENÚNCIAS — AMATRIX
====================================================== */

async function reportContent(type, topicId, targetId, targetAuthorId, targetAuthorName) {
    if (!currentUser) {
        openAccountModal();
        return;
    }

    const topic = topicsData[topicId];

    
    if (type === "message") {
        const targetMessage = currentMessagesData[targetId];

        if (targetMessage) {
            targetAuthorId = targetMessage.authorId || "";
            targetAuthorName = targetMessage.author || "Usuário";
        }
    }


    if (!topic) {
        showToast("Este tópico não está mais disponível.");
        return;
    }

    if (targetAuthorId && targetAuthorId === currentUser.uid) {
        showToast("Você não pode denunciar seu próprio conteúdo.");
        return;
    }

    const reasonChoice = prompt(
        "Por que deseja denunciar este conteúdo?\n\n" +
        "1 — Spam\n" +
        "2 — Conteúdo ofensivo\n" +
        "3 — Assédio\n" +
        "4 — Conteúdo inadequado\n" +
        "5 — Outro\n\n" +
        "Digite o número da opção:"
    );

    if (reasonChoice === null) return;

    const reasons = {
        "1": "spam",
        "2": "offensive",
        "3": "harassment",
        "4": "inappropriate",
        "5": "other"
    };

    const reason = reasons[reasonChoice.trim()];

    if (!reason) {
        showToast("Opção inválida. Tente denunciar novamente.");
        return;
    }

    const details = prompt(
        "Deseja acrescentar detalhes à denúncia? (opcional)"
    );

    if (details === null) return;

    const reportButton = document.querySelector(
        `[data-report-type="${type}"][data-report-target="${targetId}"]`
    );

    if (reportButton) reportButton.disabled = true;

    try {
        const reportRef = db.ref("reports").push();

        const report = {
            reporterUid: currentUser.uid,
            reporterName: currentUser.nickname || "Usuário",
            topicId: topicId,
            targetId: targetId,
            reportType: type,
            reason: reason,
            details: details.trim(),
            targetAuthorId: targetAuthorId || "",
            targetAuthorName: targetAuthorName || "Usuário",
            topicTitle: topic.title || "Tópico sem título",
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            status: "pending"
        };

        await reportRef.set(report);

        showToast("Denúncia enviada. Obrigado por ajudar a comunidade ★");

    } catch (error) {
        console.error("Erro ao enviar denúncia:", error);

        showToast(
            "Não foi possível enviar a denúncia. Verifique as regras do Firebase."
        );

        if (reportButton) reportButton.disabled = false;
    }
}


function updateNotificationVisibility() {
    const notificationArea = document.getElementById("notificationArea");

    if (!notificationArea) return;

    notificationArea.hidden = !currentUser;
}


/* =====================================================
   NOTIFICAÇÕES DO AMATRIX
====================================================== */

let notificationsData = {};
let notificationsUserId = null;

function listenNotifications() {
    if (!currentUser || !db) return;

    const uid = currentUser.uid;

    // Evita manter o listener de outra conta.
    if (notificationsUserId) {
        db.ref("notifications/" + notificationsUserId)
            .off("value");
    }

    notificationsUserId = uid;
    notificationsData = {};

    const notificationsRef = db.ref("notifications/" + uid);

    notificationsRef.on("value", snapshot => {
        // Ignora respostas atrasadas de uma conta anterior.
        if (!currentUser || currentUser.uid !== uid) return;

        notificationsData = snapshot.val() || {};
        renderNotifications();
    }, error => {
        console.error("Erro ao carregar notificações:", error);
    });
}

function renderNotifications() {
    const list = document.getElementById("notificationList");
    const badge = document.getElementById("notificationBadge");

    if (!list || !badge) return;

    const notifications = Object.entries(notificationsData)
        .map(([id, notification]) => ({
            ...notification,
            id
        }))
        .sort((a, b) =>
            (b.createdAt || 0) - (a.createdAt || 0)
        );

    const unreadCount = notifications.filter(
        notification => notification.read !== true
    ).length;

    badge.textContent = unreadCount > 99
        ? "99+"
        : String(unreadCount);

    badge.hidden = unreadCount === 0;

    if (!currentUser) {
        list.innerHTML = `
            <p class="notification-empty">
                Entre na sua conta para ver as notificações ♡
            </p>
        `;
        return;
    }

    if (!notifications.length) {
        list.innerHTML = `
            <p class="notification-empty">
                Nenhuma notificação por enquanto ★
            </p>
        `;
        return;
    }

    list.innerHTML = notifications.map(notification => `
        <button
            type="button"
            class="notification-item ${
                notification.read === true ? "" : "unread"
            }"
            data-notification-id="${escapeHTML(notification.id)}">

            <strong>
                ${notification.type === "like" ? "♡ Curtida" : "💬 Resposta"}
            </strong>

            <span>
                ${escapeHTML(notification.text || "Você tem uma nova notificação.")}
            </span>

            <small>
                ${formatTime(notification.createdAt)}
                ${notification.read === true ? " · lida" : " · nova"}
            </small>
        </button>
    `).join("");
}

async function markNotificationRead(notificationId) {
    if (!currentUser || !notificationId) return;

    try {
        await db
            .ref(
                "notifications/" +
                currentUser.uid +
                "/" +
                notificationId +
                "/read"
            )
            .set(true);
    } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error);
        showToast("Não foi possível atualizar a notificação.");
    }
}

// Abre e fecha o painel do sino.
document
    .getElementById("notificationButton")
    ?.addEventListener("click", () => {
        const panel = document.getElementById("notificationPanel");

        if (!panel) return;

        panel.hidden = !panel.hidden;
    });

// Clicar em uma notificação marca como lida e abre o tópico.
document
    .getElementById("notificationList")
    ?.addEventListener("click", async event => {
        const item = event.target.closest("[data-notification-id]");

        if (!item || !currentUser) return;

        const notificationId = item.dataset.notificationId;
        const notification = notificationsData[notificationId];

        if (!notification) return;

        await markNotificationRead(notificationId);

        const panel = document.getElementById("notificationPanel");
        if (panel) panel.hidden = true;

        if (notification.topicId) {
            openTopic(notification.topicId);
        }
    });

// Marca todas as notificações como lidas.
document
    .getElementById("markAllNotificationsRead")
    ?.addEventListener("click", async () => {
        if (!currentUser) return;

        const updates = {};

        Object.entries(notificationsData).forEach(([id, notification]) => {
            if (notification.read !== true) {
                updates[id + "/read"] = true;
            }
        });

        if (!Object.keys(updates).length) return;

        try {
            await db
                .ref("notifications/" + currentUser.uid)
                .update(updates);
        } catch (error) {
            console.error(
                "Erro ao marcar notificações como lidas:",
                error
            );
            showToast("Não foi possível atualizar as notificações.");
        }
    });




        /* =====================================================
           ENVIAR RESPOSTA
        ====================================================== */

        
    

const replyForm = document.getElementById("replyForm");

if (replyForm) {
    replyForm.addEventListener("submit", async event => {

        event.preventDefault();

        
if (!currentUser || !currentTopicId) {
    showToast("Entre na sua conta para responder ★");
    return;
}

if (await isCurrentUserSuspended()) {
    showToast("Sua conta está suspensa e não pode enviar respostas.");
    return;
}


        const replyInput = document.getElementById("replyText");
        const text = replyInput.value.trim();

        if (!text) return;

        const topicId = currentTopicId;
        const sendButton = replyForm.querySelector(
    'button[type="submit"]'
);
        if (sendButton) sendButton.disabled = true;

        try {
            // 1. Salva a resposta
            const ref = db
                .ref("topicMessages/" + topicId)
                .push();

            await ref.set({
                author: currentUser.nickname,
                authorId: currentUser.uid,
                text: text,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });

            replyInput.value = "";
            showToast("Mensagem enviada ★");

            // 2. Notifica o autor do tópico
            try {
                const topicSnapshot = await db
                    .ref("topics/" + topicId)
                    .once("value");

                const topic = topicSnapshot.val();

                if (
                    topic &&
                    topic.authorId &&
                    topic.authorId !== currentUser.uid
                ) {
                    const notificationRef = db
                        .ref("notifications/" + topic.authorId)
                        .push();

                    await notificationRef.set({
                        type: "reply",
                        fromUid: currentUser.uid,
                        fromName: currentUser.nickname,
                        text: currentUser.nickname +
                            " respondeu ao seu tópico: " +
                            topic.title,
                        topicId: topicId,
                        createdAt:
                            firebase.database.ServerValue.TIMESTAMP,
                        read: false
                    });
                }
            } catch (notificationError) {
                console.error(
                    "A resposta foi salva, mas a notificação falhou:",
                    notificationError
                );
            }

            // 3. Atualiza os contadores
            try {
                await db
                    .ref("topics/" + topicId + "/replies")
                    .transaction(value => (value || 0) + 1);

                await db
                    .ref("topics/" + topicId + "/lastActivity")
                    .set(firebase.database.ServerValue.TIMESTAMP);

            } catch (counterError) {
                console.error(
                    "Mensagem salva, mas não foi possível atualizar os contadores:",
                    counterError
                );
            }

        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);

            showToast(
                "Não foi possível enviar. Verifique sua conexão e permissões ★"
            );
        } finally {
            if (sendButton) sendButton.disabled = false;
        }
    
    });
}




      
/* =====================================================
   MENSAGENS RECENTES
====================================================== */

let allMessages = [];
let allTopics = {};
let recentMessageListeners = {};




function listenMessages() {
    if (!db || !currentUser) return;

    db.ref("topics").on("value", snapshot => {
        allTopics = snapshot.val() || {};

        const topicIds = Object.keys(allTopics);

        // Remove somente os listeners desta função
        // para tópicos que já não existem.
        Object.keys(recentMessageListeners).forEach(topicId => {
            if (!allTopics[topicId]) {
                db.ref("topicMessages/" + topicId)
                    .off("value", recentMessageListeners[topicId]);

                delete recentMessageListeners[topicId];
            }
        });

        // Consulta cada caminho individualmente,
        // respeitando as regras atuais do Firebase.
        topicIds.forEach(topicId => {
            if (recentMessageListeners[topicId]) return;

            const callback = snapshot => {
                const topic = allTopics[topicId];

                if (!topic) return;

                // Recalcula as respostas dos tópicos
                // pertencentes à conta conectada.
                const messages = [];

                Object.entries(allTopics).forEach(([id, item]) => {
                    if (!item || item.authorId !== currentUser.uid) {
                        return;
                    }

                    const repliesSnapshot = id === topicId
                        ? snapshot.val()
                        : null;

                    if (repliesSnapshot) {
                        Object.entries(repliesSnapshot).forEach(
                            ([messageId, message]) => {
                                if (!message) return;

                                messages.push({
                                    ...message,
                                    messageId,
                                    topicId: id,
                                    topicTitle: item.title || "Tópico sem título"
                                });
                            }
                        );
                    }
                });

                // Preserva as respostas coletadas dos outros tópicos.
                updateMessagesFromTopic(topicId, snapshot.val());
            };

            recentMessageListeners[topicId] = callback;

            db.ref("topicMessages/" + topicId).on(
                "value",
                callback,
                error => {
                    console.error(
                        "[Recent Messages] Erro no tópico " + topicId + ":",
                        error
                    );
                }
            );
        });
    });
}


function updateMessagesFromTopic(topicId, replies) {
    const topic = allTopics[topicId];

    if (!topic) return;

    // Guarda todas as respostas recebidas por tópico.
    if (!window.amatrixRecentReplies) {
        window.amatrixRecentReplies = {};
    }

    window.amatrixRecentReplies[topicId] = replies || {};

    const messages = [];

    Object.entries(allTopics).forEach(([id, item]) => {
        if (!item || item.authorId !== currentUser.uid) return;

        const topicReplies = window.amatrixRecentReplies[id] || {};

        Object.entries(topicReplies).forEach(([messageId, message]) => {
            if (!message) return;

            messages.push({
                ...message,
                messageId,
                topicId: id,
                topicTitle: item.title || "Tópico sem título"
            });
        });
    });

    messages.sort((a, b) =>
        (b.createdAt || 0) - (a.createdAt || 0)
    );

    allMessages = messages.slice(0, 6);
    renderRecentMessages();
}



function updateRecentMessages() {
    allMessages.sort((a, b) =>
        (b.createdAt || 0) - (a.createdAt || 0)
    );

    allMessages = allMessages.slice(0, 6);

    renderRecentMessages();
}

function renderRecentMessages() {
    const containers = [
        document.getElementById("recentMessages"),
        document.getElementById("homeMessages")
    ];

    containers.forEach(container => {
        if (!container) return;

        if (!currentUser) {
            container.innerHTML = `
                <div class="empty">
                    entre para ver mensagens
                </div>
            `;
            return;
        }

        if (!allMessages.length) {
            container.innerHTML = `
                <div class="empty">
                    nenhuma resposta aos seus tópicos ainda ★
                </div>
            `;
            return;
        }

        container.innerHTML = allMessages.map(message => `
            <div class="message">
                <strong>
                    ${escapeHTML(message.author || "Usuário")} respondeu:
                </strong>

                <div>
                    ${escapeHTML(message.text || "")}
                </div>

                <small>
                    Tópico: ${escapeHTML(message.topicTitle)}
                </small>
            </div>
        `).join("");
    });
}



        
/* =====================================================
   USUÁRIOS ONLINE
====================================================== */

let usersData = {};

function listenUsers() {

    db.ref("users").on("value", snapshot => {

        usersData = snapshot.val() || {};

        // O status é calculado pelas conexões reais.
        Object.values(usersData).forEach(user => {

            const connections = user.connections || {};

            user.online =
                Object.keys(connections).length > 0;

        });

        renderOnline();

        renderMembers();

        renderTopics();

    });

}

       

function renderOnline() {

    const container = document.getElementById("onlineUsers");

    if (!currentUser) {

        container.innerHTML = `
            <div class="empty">
                entre para visualizar
            </div>
        `;

        return;
    }

    const online = Object.values(usersData).filter(user => {

        return (
            user.year === currentUser.year &&
            user.online === true
        );

    });

    if (!online.length) {

        container.innerHTML = `
            <div class="empty">
                ninguém online
            </div>
        `;

        return;
    }

    container.innerHTML = online.map(user => `

        <div class="online-user">

            <span class="online-dot"></span>

            ${escapeHTML(user.nickname)}

        </div>

    `).join("");

}


        /* =====================================================
           MEMBROS
        ====================================================== */

        function renderMembers() {

            const grid =
                document
                .getElementById(
                    "membersGrid"
                );


            if (!currentUser) {

                grid.innerHTML = `

                    <div class="empty">

                        Entre para visualizar
                        os membros.

                    </div>

                `;

                return;

            }


            const members =
                Object
                .values(usersData)
                .filter(
                    user =>
                        user.year ===
                        currentUser.year
                );


            if (!members.length) {

                grid.innerHTML = `

                    <div class="empty">

                        Nenhum membro encontrado.

                    </div>

                `;

                return;

            }


            grid.innerHTML =
                members
                .map(
                    user => {

                        const avatar =
                            user.photo

                            ?

                            `

                            <img
                                src="${user.photo}"
                                alt="">

                            `

                            :

                            escapeHTML(
                                user.nickname
                                .charAt(0)
                                .toUpperCase()
                            );


                        return `

                            <div
                                class="member-card">

                                <div class="avatar">

                                    ${avatar}

                                </div>


                                <h3>

                                    ${escapeHTML(
                                        user.nickname
                                    )}

                                </h3>


                                <small>

                                    ${escapeHTML(
                                        user.year
                                    )}

                                    <br>

                                    ${user.online
                                        ? "● online"
                                        : "○ offline"}

                                </small>

                            </div>

                        `;

                    }
                )
                .join("");

        }


       


/* =====================================================
   PRESENÇA ONLINE - CONTROLE DE CONEXÕES
====================================================== */

function setupPresence() {

    if (!currentUser || !firebaseReady)
        return;

    const userRef = db.ref(
        "users/" + currentUser.uid
    );

    const connectedRef = db.ref(".info/connected");

    connectedRef.on("value", async snapshot => {

        if (snapshot.val() !== true) {
            return;
        }

        try {

            // Cria uma conexão exclusiva para esta aba.
            const connectionRef = userRef
            .child("connections")
            .push();

            activeConnectionRef = connectionRef;

            // O servidor removerá esta conexão
            // quando a aba perder a conexão.
            await connectionRef.onDisconnect().remove();

            // Registra a conexão atual.
            await connectionRef.set(true);

            // Atualiza o horário da última conexão.
            await userRef.update({

                online: true,

                lastSeen:
                    firebase.database.ServerValue.TIMESTAMP

            });

        } catch (error) {

            console.error(
                "Erro ao registrar presença:",
                error
            );

        }

    });

}




        /* =====================================================
           DATA
        ====================================================== */

        function formatTime(timestamp) {

            if (!timestamp)
                return "agora";


            const date =
                new Date(
                    timestamp
                );


            const now =
                new Date();


            const diff =
                now - date;


            const minutes =
                Math.floor(
                    diff / 60000
                );


            if (minutes < 1)
                return "agora";


            if (minutes < 60)
                return (
                    minutes +
                    " min atrás"
                );


            const hours =
                Math.floor(
                    minutes / 60
                );


            if (hours < 24)
                return (
                    hours +
                    " h atrás"
                );


            const days =
                Math.floor(
                    hours / 24
                );


            if (days < 7)
                return (
                    days +
                    " d atrás"
                );


            return date.toLocaleDateString(
                "pt-BR"
            );

        }


        /* =====================================================
           FECHAR MODAIS CLICANDO FORA
        ====================================================== */

        [
            accountModal,
            topicModal,
            viewTopicModal
        ]
        .forEach(modal => {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        modal
                    ) {

                        modal.classList.remove(
                            "open"
                        );

                    }

                }
            );

        });


        /* =====================================================
           ESTADO INICIAL
        ====================================================== */

        updateLoggedOutUI();

        
/* =====================================================
   MATÉRIAS — AMATRIX
====================================================== */

const SUBJECTS = [
    "Português",
    "Matemática",
    "Biologia",
    "Química",
    "Física",
    "Filosofia",
    "Geografia",
    "História",
    "Artes",
    "Inglês",
    "Espanhol",
    "Sociologia",
    "Matéria do Curso"
];

/* =====================================================
   MOSTRAR MATÉRIAS
====================================================== */

function renderSubjectsPage() {
    const grid = document.getElementById("subjectsGrid");
    const panel = document.getElementById("selectedSubjectPanel");
    const title = document.getElementById("selectedSubjectTitle");
    const form = document.getElementById("subjectTopicForm");
    const list = document.getElementById("subjectTopicsList");

    if (!grid || !panel || !title) return;

    // Mostrar todas as matérias.
    grid.innerHTML = SUBJECTS.map(subject => `
        <button
            type="button"
            class="subject-card ${
                selectedSubject === subject ? "selected" : ""
            }"
            onclick="selectSubject('${subject}')">
            ★ ${escapeHTML(subject)}
        </button>
    `).join("");

    // Criar o botão de voltar.
    let backButton = document.getElementById("subjectBackButton");

    if (!backButton) {
        backButton = document.createElement("button");
        backButton.id = "subjectBackButton";
        backButton.type = "button";
        backButton.className = "white-button";
        backButton.textContent = "← voltar às matérias";
        backButton.style.marginBottom = "16px";

        backButton.addEventListener("click", () => {
            selectedSubject = null;
            resetSubjectTopicForm();
            renderSubjectsPage();
        });

       panel.parentNode.insertBefore(backButton, panel);
    }

    // O botão voltar só aparece quando uma matéria está selecionada.
    backButton.style.display =
        currentUser && selectedSubject ? "inline-flex" : "none";

    // Esconder a grade ao entrar em uma matéria.
    grid.style.display =
        currentUser && selectedSubject ? "none" : "";

    // Se o usuário não estiver conectado.
    if (!currentUser) {
        panel.style.display = "block";
        title.textContent = "★ Entre para usar as matérias";

        if (form) {
            form.style.display = "none";
        }

        if (list) {
            list.innerHTML = `
                <div class="empty">
                    Entre ou cadastre-se para criar seus tópicos de estudo.
                    <br><br>
                    <button
                        type="button"
                        class="pink-button"
                        onclick="openAccountModal()">
                        entrar / cadastrar
                    </button>
                </div>
            `;
        }

        return;
    }

    if (form) {
        form.style.display = "flex";
    }

    // Nenhuma matéria selecionada: mostrar a grade.
    if (!selectedSubject) {
        panel.style.display = "none";
        return;
    }

    // Matéria selecionada: mostrar apenas seus tópicos.
    panel.style.display = "block";
    title.textContent = "★ " + selectedSubject;

    renderSubjectTopics();
}

/* =====================================================
   SELECIONAR MATÉRIA
====================================================== */

function selectSubject(subject) {
    if (!currentUser) {
        openAccountModal();
        return;
    }

    if (!SUBJECTS.includes(subject)) {
        return;
    }

    selectedSubject = subject;

    resetSubjectTopicForm();
    renderSubjectsPage();
}

/* =====================================================
   CARREGAR TÓPICOS DE ESTUDO DO USUÁRIO
====================================================== */



function listenSubjectTopics() {
    // Matérias e Fórum usam os mesmos tópicos.
    // Aqui apenas atualizamos a lista da matéria selecionada.
    subjectTopicsData = {};

    if (typeof topicsData !== "undefined" && topicsData) {
        Object.entries(topicsData).forEach(([id, topic]) => {
            if (topic && topic.subject) {
                subjectTopicsData[id] = {
                    ...topic,
                    id: topic.id || id,
                    content: topic.description || topic.content || ""
                };
            }
        });
    }

    renderSubjectsPage();
}



/* =====================================================
   LISTAR TÓPICOS DA MATÉRIA SELECIONADA
====================================================== */

function renderSubjectTopics() {
    const list = document.getElementById("subjectTopicsList");
    if (!list) return;

    if (!currentUser) {
        list.innerHTML = `<div class="empty">Entre na sua conta para continuar.</div>`;
        return;
    }

    if (!selectedSubject) {
        list.innerHTML = `<div class="empty">Escolha uma matéria acima ★</div>`;
        return;
    }

    const topics = Object.values(topicsData || {})
        .filter(topic =>
            topic &&
            topic.subject === selectedSubject &&
            topic.year === currentUser.year
        )
        .sort((a, b) =>
            (b.lastActivity || b.createdAt || 0) -
            (a.lastActivity || a.createdAt || 0)
        );

    if (!topics.length) {
        list.innerHTML = `
            <div class="empty">
                Você ainda não criou tópicos em
                ${escapeHTML(selectedSubject)}.
                <br><br>
                Use o formulário para começar ★
            </div>
        `;
        return;
    }

    list.innerHTML = topics.map(topic => {
        const id = topic.id;
        const resolved = topic.status === "resolvido";
        const canEdit = topic.authorId === currentUser.uid;

        return `
            <article class="subject-topic-card">
                <h4>${escapeHTML(topic.title || "Sem título")}</h4>

                <div class="subject-topic-meta">
                    Matéria: ${escapeHTML(topic.subject)}
                    · por ${escapeHTML(topic.author || "Usuário")}
                    · ${formatTime(topic.lastActivity || topic.createdAt)}
                </div>

                <span class="topic-status-tag ${resolved ? "resolved" : "open"}">
                    ${resolved ? "✓ Resolvido" : "● Em aberto"}
                </span>

                <div class="subject-topic-content">
                    ${escapeHTML(topic.description || topic.content || "")}
                </div>

                <div class="subject-topic-actions">
                    <button
                        type="button"
                        class="pink-button"
                        onclick="openTopic('${id}')">
                        abrir tópico e respostas
                    </button>

                    ${canEdit ? `
                        <button
                            type="button"
                            class="white-button"
                            onclick="editSubjectTopic('${id}')">
                            editar
                        </button>

                        <button
                            type="button"
                            class="white-button"
                            onclick="toggleTopicStatus('${id}')">
                            ${resolved ? "reabrir tópico" : "marcar como resolvido"}
                        </button>

                        <button
                            type="button"
                            class="white-button"
                            onclick="deleteSubjectTopic('${id}')">
                            excluir
                        </button>
                    ` : ""}
                </div>
            </article>
        `;
    }).join("");
}



/* =====================================================
   LIMPAR FORMULÁRIO
====================================================== */

function resetSubjectTopicForm() {
    const form = document.getElementById("subjectTopicForm");

    if (!form) return;

    form.reset();

    document.getElementById("subjectTopicId").value = "";

    document.getElementById("saveSubjectTopicButton").textContent =
        "salvar tópico ★";

    document.getElementById("cancelSubjectEdit").style.display =
        "none";

    const message = document.getElementById("subjectTopicMessage");

    if (message) {
        message.innerHTML = "";
    }
}

/* =====================================================
   CANCELAR EDIÇÃO
====================================================== */

document
    .getElementById("cancelSubjectEdit")
    .addEventListener("click", () => {
        resetSubjectTopicForm();
    });

/* =====================================================
   SALVAR TÓPICOS SEM SUBSTITUIR OS ANTERIORES
====================================================== */

document.getElementById("subjectTopicForm").addEventListener("submit", async event => {
    event.preventDefault();

    if (!firebaseReady || !currentUser || !selectedSubject) {
        showToast("Entre e escolha uma matéria primeiro.");
        return;
    }

    const title = document.getElementById("subjectTopicTitle").value.trim();
    const description = document.getElementById("subjectTopicContent").value.trim();
    const topicId = document.getElementById("subjectTopicId").value;

    if (!title || !description) {
        showToast("Preencha o título e o conteúdo.");
        return;
    }

    try {
        if (topicId) {
            const existing = topicsData[topicId];

            if (!existing || existing.authorId !== currentUser.uid) {
                showToast("Você não pode editar este tópico.");
                return;
            }

            await db.ref("topics/" + topicId).update({
                title,
                description,
                lastActivity: firebase.database.ServerValue.TIMESTAMP
            });

            showToast("Tópico atualizado ★");
        } else {
            const topicRef = db.ref("topics").push();

            await topicRef.set({
                id: topicRef.key,
                authorId: currentUser.uid,
                author: currentUser.nickname || "Usuário",
                year: currentUser.year,
                title,
                description,
                subject: selectedSubject,
                status: "aberto",
                replies: 0,
                views: 0,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                lastActivity: firebase.database.ServerValue.TIMESTAMP
            });

            showToast("Novo tópico criado ★");
        }

        resetSubjectTopicForm();
    } catch (error) {
        console.error("Erro ao salvar tópico de matéria:", error);
        showToast("Não foi possível salvar. Verifique o console.");
    }
});



/* =====================================================
   EDITAR TÓPICO
====================================================== */

function editSubjectTopic(topicId) {
    if (!currentUser) {
        openAccountModal();
        return;
    }

    const topic = topicsData[topicId];

    if (!topic || topic.authorId !== currentUser.uid) {
        showToast("Você não pode editar este tópico.");
        return;
    }

    selectedSubject = topic.subject;
    renderSubjectsPage();

    document.getElementById("subjectTopicId").value = topicId;
    document.getElementById("subjectTopicTitle").value = topic.title || "";
    document.getElementById("subjectTopicContent").value =
        topic.description || topic.content || "";

    document.getElementById("saveSubjectTopicButton").textContent =
        "salvar alterações ★";

    document.getElementById("cancelSubjectEdit").style.display =
        "inline-block";

    document.getElementById("selectedSubjectPanel").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}



/* =====================================================
   EXCLUIR TÓPICO
====================================================== */




async function deleteSubjectTopic(topicId) {
    if (!currentUser) {
        openAccountModal();
        return;
    }

    const topic = topicsData[topicId];

    if (!topic || topic.authorId !== currentUser.uid) {
        showToast("Você não pode excluir este tópico.");
        return;
    }

    if (!confirm(`Deseja excluir o tópico "${topic.title}"?`)) {
        return;
    }

    try {
        await db.ref("topics/" + topicId).remove();

        if (document.getElementById("subjectTopicId").value === topicId) {
            resetSubjectTopicForm();
        }

        showToast("Tópico excluído ★");
    } catch (error) {
        console.error("Erro ao excluir tópico:", error);
        showToast("Não foi possível excluir. Verifique as regras do Firebase.");
    }
}


/* =====================================================
   INICIALIZAÇÃO DA ÁREA DE MATÉRIAS
====================================================== */

renderSubjectsPage();


/* =====================================================
   PAINEL DE MODERAÇÃO — AMATRIX
====================================================== */

let moderationReportsRef = null;
let moderationReportsData = {};
let moderationPanelElement = null;
let moderationButtonElement = null;


async function setupModerationUI() {
    console.log("[Amatrix Moderação] Função iniciada.");

    removeModerationUI();

    if (!currentUser || !db) {
        console.error(
            "[Amatrix Moderação] currentUser ou db não está disponível.",
            { currentUser: !!currentUser, db: !!db }
        );
        return;
    }

    const uid = currentUser.uid;
    console.log("[Amatrix Moderação] UID conectado:", uid);

    try {
        const snapshot = await db
            .ref("moderators/" + uid)
            .once("value");

            console.log("Banco conectado:", db.ref().toString());
console.log("Caminho consultado:", "moderators/" + uid);
console.log("Valor encontrado:", snapshot.val());

        if (!currentUser || currentUser.uid !== uid) {
            console.warn("[Amatrix Moderação] A conta mudou durante a consulta.");
            return;
        }

        console.log(
            "[Amatrix Moderação] Autorização encontrada:",
            snapshot.val(),
            "| Tipo:",
            typeof snapshot.val()
        );

        if (snapshot.val() !== true) {
            console.warn(
                "[Amatrix Moderação] Esta conta não foi reconhecida como moderadora."
            );
            return;
        }

        moderationButtonElement = document.createElement("button");
        moderationButtonElement.type = "button";
        moderationButtonElement.id = "amatrixModerationButton";
        moderationButtonElement.textContent = "⚑ Moderação";

        Object.assign(moderationButtonElement.style, {
            position: "fixed",
            right: "20px",
            bottom: "20px",
            zIndex: "99998",
            padding: "12px 18px",
            border: "2px solid #222",
            borderRadius: "12px",
            background: "#f32c91",
            color: "#fff",
            fontWeight: "800",
            cursor: "pointer",
            boxShadow: "3px 3px 0 #222"
        });

        moderationButtonElement.addEventListener("click", () => {
            if (!moderationPanelElement) return;

            moderationPanelElement.style.display =
                moderationPanelElement.style.display === "none"
                    ? "block"
                    : "none";
        });

        moderationPanelElement = document.createElement("section");
        moderationPanelElement.id = "amatrixModerationPanel";

        Object.assign(moderationPanelElement.style, {
            display: "none",
            position: "fixed",
            inset: "5% 5%",
            zIndex: "99999",
            overflowY: "auto",
            padding: "22px",
            background: "#fff7fb",
            color: "#222",
            border: "3px solid #222",
            borderRadius: "16px",
            boxShadow: "5px 5px 0 #f32c91"
        });

        moderationPanelElement.innerHTML = `
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;">
                <h2 style="margin:0;color:#c5146b;">⚑ Denúncias do Amatrix</h2>
                <button type="button" id="closeAmatrixModeration"
                    class="white-button">Fechar ✕</button>
            </div>
            <p>Consulte as denúncias e atualize o andamento de cada caso.</p>
            <div id="amatrixModerationReports">Carregando denúncias...</div>
        `;

        document.body.appendChild(moderationPanelElement);
        document.body.appendChild(moderationButtonElement);

        document
            .getElementById("closeAmatrixModeration")
            .addEventListener("click", () => {
                moderationPanelElement.style.display = "none";
            });

        moderationPanelElement.addEventListener("change", async event => {
            const select = event.target.closest("[data-moderation-report]");
            if (!select) return;

            const reportId = select.dataset.moderationReport;
            const newStatus = select.value;

            if (![
                "pending",
                "reviewing",
                "dismissed",
                "action_taken"
            ].includes(newStatus)) return;

            try {
                await db.ref("reports/" + reportId + "/status").set(newStatus);
                showToast("Status da denúncia atualizado ★");
            } catch (error) {
                console.error("[Amatrix Moderação] Erro ao atualizar status:", error);
                showToast("Erro ao atualizar. Confira as regras do Firebase.");
            }
        });

        
moderationPanelElement.addEventListener("click", async event => {
    const button = event.target.closest("[data-suspend-action]");
    if (!button) return;

    const targetUid = button.dataset.suspendUser;
    const targetName = button.dataset.suspendName || "Usuário";
    const action = button.dataset.suspendAction;

    if (!targetUid) {
        showToast("Não foi possível identificar o usuário.");
        return;
    }

    const reason = prompt(
        "Informe o motivo da ação para " + targetName + ":",
        "Violação das regras do fórum"
    );

    if (reason === null) return;

    const cleanReason = reason.trim();

    if (!cleanReason) {
        showToast("Informe um motivo.");
        return;
    }

    button.disabled = true;

    try {
        const success = await setUserSuspension(
            targetUid,
            action === "suspend",
            cleanReason
        );

        if (success) {
            showToast("Ação de moderação concluída ★");
        }
    } finally {
        button.disabled = false;
    }
});


moderationPanelElement.addEventListener("click", async event => {
    const button = event.target.closest("[data-delete-content]");

    if (!button) return;

    const reportId = button.dataset.deleteReport;

    if (!reportId) {
        showToast("Não foi possível identificar a denúncia.");
        return;
    }

    button.disabled = true;

    try {
        await deleteReportedContent(reportId);
    } finally {
        button.disabled = false;
    }
});



        moderationReportsRef = db.ref("reports");

        moderationReportsRef.on("value", reportsSnapshot => {
            if (!currentUser || currentUser.uid !== uid) return;

            moderationReportsData = reportsSnapshot.val() || {};
            renderModerationReports();
        }, error => {
            console.error("[Amatrix Moderação] Erro ao carregar denúncias:", error);

            const container = document.getElementById("amatrixModerationReports");
            if (container) {
                container.textContent =
                    "Erro ao carregar denúncias. Verifique as permissões do Firebase.";
            }
        });

        console.log("[Amatrix Moderação] Botão criado com sucesso.");

    } catch (error) {
        console.error(
            "[Amatrix Moderação] Erro ao verificar autorização:",
            error
        );
    }
}


/* =====================================================
   EXCLUIR CONTEÚDO DENUNCIADO — MODERAÇÃO
====================================================== */

async function deleteReportedContent(reportId) {
    if (!currentUser || !db || !reportId) {
        showToast("Não foi possível excluir o conteúdo.");
        return;
    }

    try {
        // Confirma que a conta conectada é moderadora.
        const moderatorSnapshot = await db
            .ref("moderators/" + currentUser.uid)
            .once("value");

        if (moderatorSnapshot.val() !== true) {
            showToast("Apenas moderadores podem excluir conteúdo.");
            return;
        }

        // Busca a denúncia novamente no Firebase.
        const reportSnapshot = await db
            .ref("reports/" + reportId)
            .once("value");

        const report = reportSnapshot.val();

        if (!report) {
            showToast("Esta denúncia não está mais disponível.");
            return;
        }

        if (
            report.reportType !== "topic" &&
            report.reportType !== "message"
        ) {
            showToast("Tipo de conteúdo inválido.");
            return;
        }

        const topicId = report.topicId;
        const targetId = report.targetId;

        if (!topicId || !targetId) {
            showToast("Não foi possível identificar o conteúdo.");
            return;
        }

        // Confere se o tópico ainda existe.
        const topicSnapshot = await db
            .ref("topics/" + topicId)
            .once("value");

        const topic = topicSnapshot.val();

        if (!topic) {
            showToast("O tópico já não está disponível.");
            return;
        }

        let authorId = report.targetAuthorId || "";
        let contentLabel = "esta resposta";

        if (report.reportType === "topic") {
            authorId = authorId || topic.authorId || "";
            contentLabel = "este tópico";
        } else {
            // Confere a resposta específica denunciada.
            const messageSnapshot = await db
                .ref("topicMessages/" + topicId + "/" + targetId)
                .once("value");

            const message = messageSnapshot.val();

            if (!message) {
                showToast("A resposta já não está disponível.");
                return;
            }

            authorId = authorId || message.authorId || "";
        }

        const confirmed = window.confirm(
            "Tem certeza de que deseja excluir " +
            contentLabel +
            " denunciado?\n\n" +
            "Esta ação não pode ser desfeita."
        );

        if (!confirmed) return;

        const updates = {};

        if (report.reportType === "topic") {
            // Exclui somente o tópico denunciado,
            // suas respostas e as curtidas associadas.
            updates["topics/" + topicId] = null;
            updates["topicMessages/" + topicId] = null;
            updates["messageLikes/" + topicId] = null;
        } else {
            // Exclui somente a resposta denunciada
            // e as curtidas dessa resposta.
            updates[
                "topicMessages/" + topicId + "/" + targetId
            ] = null;

            updates[
                "messageLikes/" + topicId + "/" + targetId
            ] = null;
        }

        // Marca a denúncia como ação tomada.
        updates["reports/" + reportId + "/status"] = "action_taken";

        // Prepara uma notificação para o autor do conteúdo.
        if (authorId && authorId !== currentUser.uid) {
            const notificationRef = db
                .ref("notifications/" + authorId)
                .push();

            updates[
                "notifications/" + authorId + "/" + notificationRef.key
            ] = {
                type: "moderation",
                fromUid: currentUser.uid,
                fromName: currentUser.nickname || "Moderação Amatrix",
                text: report.reportType === "topic"
                    ? "Seu tópico foi removido pela moderação após análise de uma denúncia."
                    : "Sua resposta foi removida pela moderação após análise de uma denúncia.",
                topicId: topicId,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                read: false
            };
        }

       
        // Executa as alterações em uma única operação.
        await db.ref().update(updates);

        // Atualiza o contador após excluir uma resposta.
        if (report.reportType === "message") {
            try {
                await db
                    .ref("topics/" + topicId + "/replies")
                    .transaction(value => Math.max(0, (value || 0) - 1));
            } catch (counterError) {
                console.error(
                    "[Amatrix Moderação] Conteúdo excluído, mas o contador não foi atualizado:",
                    counterError
                );

                showToast(
                    "Resposta excluída, mas confira o contador de respostas."
                );
                return;
            }
        }

        showToast("Conteúdo excluído e denúncia atualizada ★");

    } catch (error) {
        console.error(
            "[Amatrix Moderação] Erro ao excluir conteúdo:",
            error
        );

        showToast(
            "Não foi possível excluir. Confira as permissões do Firebase."
        );
    }
}


function renderModerationReports() {
    const container = document.getElementById("amatrixModerationReports");

    if (!container || !currentUser) return;

    const reports = Object.entries(moderationReportsData)
        .map(([id, report]) => ({ ...report, id }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (!reports.length) {
        container.innerHTML = `
            <div class="empty">Nenhuma denúncia registrada ★</div>
        `;
        return;
    }

    const reasonLabels = {
        spam: "Spam",
        offensive: "Conteúdo ofensivo",
        harassment: "Assédio",
        inappropriate: "Conteúdo inadequado",
        other: "Outro"
    };

    const statusLabels = {
        pending: "Pendente",
        reviewing: "Em análise",
        dismissed: "Encerrada sem ação",
        action_taken: "Ação tomada"
    };

    container.innerHTML = reports.map(report => `
        <article style="margin:16px 0;padding:16px;border:2px solid #f3a4ce;border-radius:12px;background:#fff;">
            <h3 style="margin-top:0;">
                ${escapeHTML(report.topicTitle || "Tópico sem título")}
            </h3>

            <p>
                <strong>Tipo:</strong>
                ${report.reportType === "topic" ? "Tópico" : "Resposta"}
            </p>

            <p>
                <strong>Motivo:</strong>
                ${escapeHTML(reasonLabels[report.reason] || "Não especificado")}
            </p>

            <p>
                <strong>Denunciante:</strong>
                ${escapeHTML(report.reporterName || "Usuário")}
            </p>

            <p>
                <strong>Conteúdo de:</strong>
                ${escapeHTML(report.targetAuthorName || "Usuário")}
            </p>

            <p>
                <strong>Detalhes:</strong>
                ${escapeHTML(report.details || "Nenhum detalhe informado.")}
            </p>

            <p>
                <strong>Data:</strong>
                ${escapeHTML(formatTime(report.createdAt))}
            </p>

            <label>
                <strong>Status da denúncia:</strong>

                <select
                    data-moderation-report="${escapeHTML(report.id)}"
                    style="display:block;max-width:100%;margin-top:8px;padding:8px;">

                    ${Object.entries(statusLabels).map(([value, label]) => `
                        <option
                            value="${value}"
                            ${report.status === value ? "selected" : ""}>
                            ${label}
                        </option>
                    `).join("")}
                </select>
            </label>

            
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;">
            
${report.reportType === "topic" || report.reportType === "message" ? `
    <button
        type="button"
        class="white-button"
        data-delete-content="true"
        data-delete-report="${escapeHTML(report.id)}">
        Excluir ${report.reportType === "topic" ? "tópico" : "resposta"}
    </button>
` : ""}

                ${report.targetAuthorId ? `
                    <button
                        type="button"
                        class="white-button"
                        data-suspend-user="${escapeHTML(report.targetAuthorId)}"
                        data-suspend-name="${escapeHTML(report.targetAuthorName || "Usuário")}"
                        data-suspend-action="suspend">
                        Suspender usuário
                    </button>

                    <button
                        type="button"
                        class="white-button"
                        data-suspend-user="${escapeHTML(report.targetAuthorId)}"
                        data-suspend-name="${escapeHTML(report.targetAuthorName || "Usuário")}"
                        data-suspend-action="reactivate">
                        Reativar usuário
                    </button>
                ` : `
                    <p>Não foi possível identificar o UID do usuário denunciado.</p>
                `}
            </div>

        </article>
    `).join("");
}

function removeModerationUI() {
    if (moderationReportsRef) {
        moderationReportsRef.off("value");
        moderationReportsRef = null;
    }

    if (moderationButtonElement) {
        moderationButtonElement.remove();
        moderationButtonElement = null;
    }

    if (moderationPanelElement) {
        moderationPanelElement.remove();
        moderationPanelElement = null;
    }

    moderationReportsData = {};
}


/* =====================================================
   AMATRIX — SUSPENDER E REATIVAR USUÁRIOS
====================================================== */


async function setUserSuspension(
    targetUid,
    active,
    reason = "Violação das regras do fórum"
) {
    if (!currentUser || !db || !targetUid) {
        showToast("Não foi possível executar a ação.");
        return false;
    }

    if (targetUid === currentUser.uid) {
        showToast("Você não pode alterar a suspensão da própria conta.");
        return false;
    }

    try {
        const moderatorSnapshot = await db
            .ref("moderators/" + currentUser.uid)
            .once("value");

        if (moderatorSnapshot.val() !== true) {
            showToast("Apenas moderadores podem executar esta ação.");
            return false;
        }

        const targetModeratorSnapshot = await db
            .ref("moderators/" + targetUid)
            .once("value");

        if (targetModeratorSnapshot.val() === true) {
            showToast("Esta conta também é de moderador. Ação cancelada.");
            return false;
        }

        const confirmed = window.confirm(
            (active ? "Suspender" : "Reativar") +
            " esta conta?\n\nMotivo: " + reason
        );

        if (!confirmed) return false;

        const notificationRef = db
            .ref("notifications/" + targetUid)
            .push();

        const updates = {};

        updates["suspendedUsers/" + targetUid] = {
            active: active,
            reason: reason,
            updatedAt: firebase.database.ServerValue.TIMESTAMP,
            updatedBy: currentUser.uid
        };

        updates[
            "notifications/" + targetUid + "/" + notificationRef.key
        ] = {
            type: "moderation",
            fromUid: currentUser.uid,
            fromName: currentUser.nickname || "Moderação Amatrix",
            text: active
                ? "Sua conta foi suspensa. Motivo: " + reason
                : "Sua conta foi reativada. Você pode voltar a participar do Amatrix.",
            topicId: "moderation",
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            read: false
        };

        // Salva a suspensão e a notificação na mesma operação.
        await db.ref().update(updates);

        showToast(
            active ? "Conta suspensa ★" : "Conta reativada ★"
        );

        return true;

    } catch (error) {
        console.error(
            "[Amatrix Moderação] Erro na suspensão:",
            error
        );

        showToast(
            "Ação não concluída. Confira as permissões do Firebase."
        );

        return false;
    }
}
