/**
 * Web-compatible local storage module.
 * Replaces chrome.storage.local with window.localStorage equivalents.
 */

export const _get = key => {
    return new Promise((resolve, reject) => {
        try {
            const value = window.localStorage.getItem(key);
            resolve({ [key]: value ? JSON.parse(value) : undefined });
        } catch (e) {
            reject(e);
        }
    });
};

export const _set = data => {
    return new Promise((resolve, reject) => {
        try {
            Object.keys(data).forEach(key => {
                window.localStorage.setItem(key, JSON.stringify(data[key]));
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

export const _clear = () => {
    return new Promise((resolve, reject) => {
        try {
            window.localStorage.clear();
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

export const _remove = key => {
    return new Promise((resolve, reject) => {
        try {
            window.localStorage.removeItem(key);
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

export const checkForError = () => {
    // No chrome.runtime.lastError in web context — always return undefined (no error)
    return undefined;
};

class Favorites {
    getFavorites = async () => {
        return (await _get("_favorites"))._favorites || {};
    };
    setFavorites = async favorites => {
        return await _set({ _favorites: favorites });
    };
    upsertFavorite = async merchantData => {
        const favs = await this.getFavorites();
        favs[merchantData.organizationName] = merchantData;
        await this.setFavorites(favs);
        return merchantData;
    };
    removeFavorite = async organizationName => {
        const favs = await this.getFavorites();
        favs[organizationName] = undefined;
        delete favs[organizationName];
        return favs;
    };
    isFavorite = async organizationName => {
        return (await this.getFavorites())[organizationName] !== undefined;
    };
}
export const favorites = new Favorites();

class NewOffers {
    getNewOffers = async () => {
        return (await _get("_new_offers"))._new_offers || {};
    };
    setNewOffers = async newOffers => {
        const today = new Date();
        const tomorrow = new Date(today);
        return await _set({ _new_offers: {hasNewOffers: newOffers, expiry: tomorrow.setDate(tomorrow.getDate() + 1)}});
    };
}
export const newOffers = new NewOffers();

class Decrypted {
    get = async () => {
        const data =
            {
                ...(await _get("_decrypted"))._decrypted,
            } || {};
        return data;
    };
    set = async decrypted => {
        return await _set({ _decrypted: decrypted });
    };
    clear = async () => {
        return await _remove("_decrypted");
    };
}

export const decrypted = new Decrypted();

class Dapps {
    getDapps = async () => {
        return (await _get("_dapps"))._dapps || {};
    };
    setDapps = async dapps => {
        return await _set({ _dapps: dapps });
    };
    clear = async () => {
        return await _set({ _dapps: {}});
    };
}
export const dapps = new Dapps();