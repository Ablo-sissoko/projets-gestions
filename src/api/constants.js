
export const ENDPOINTS = {
    PRODUCTS: {
        CREATE: "product/create",
        UPDATE: "",
        SEARCH: "product/search",
        DELETE: "",
        CATEGORIES: {
            CREATE: "categories/create",
            UPDATE: "categories/update/id",
            DELETE: "categories/delete",
            SEARCH: "categories/read"
        },
        UNITES: "product/unite/read"
    },
    RAPPORTS: {
        SEARCH: "rapports/search",
    },
    PROFORMAT_DEVIS: {
        CREATE: "facture/proforma/create"
    },
    STATISTIQUES: {
        ANNUEL: "statistics/annual/entreprise_id",
        PRODUIT_TOTAL: "statistics/product/entreprise_id",
        TOTAL_EMPLOYE: "statistics/employee",
        VENTE_TOTAL: "statistics/ventes/total",
        SEMAINE: "statistics/week",
        BON_DE_COMMANDES: "statistics/soldes"
    },
    TRANSFERTS: {
        CREATE: "comptabilite/compte/transfert/create",
        UPDATE: "comptabilite/compte/transfert/update/id",
        SEARCH: "comptabilite/compte/transfert/search"
    },
    COMPETE_BANCAIRE: {
        CREATE: "comptabilite/compte/create",
        UPDATE: "comptabilite/compte/update/id",
        SEARCH: "comptabilite/compte/search",
    },
    REVENUS: {
        SEARCH: "comptabilite/revenu/liste"
    },
    DEPENSES: {
        SEARCH: "comptabilite/depenses/search",
        CREATE: "comptabilite/depenses/create",
        UPDATE: "comptabilite/depenses/update/id"
    },
    CATEGORIES_DEPENSES: {
        CREATE: "comptabilite/depenses/category/create",
        UPDATE: "comptabilite/depenses/category/update/id",
        SEARCH: "comptabilite/depenses/category/list"
    },
    SOLDE_BY_COMPTE: "comptabilite/comptes/soldes/ id_compte/entreprise_id",
    FOURNISSEURS: {
        CREATE: "fournisseurs/create",
        UPDATE: "fournisseurs/update/id",
        SEARCH: "fournisseurs/search"
    },
    BON_DE_COMMANDES : {
        CREATE :"boncommande/create"
    },
    CLIENTS :{
        CREATE :"clients/create",
        UPDATE :"clients/update/id",
        SEARCH :"clients/search"
    },
    VENTES :{
        CREATE :"vente/create",
        SEARCH :"vente/liste"
    }

}