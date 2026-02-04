// Re-export all commands
export { resolve } from "./resolve";
export { profile } from "./profile";
export { available } from "./available";
export { list } from "./list";
export { register } from "./register";
export { setTxt, setAddress, setPrimary } from "./edit";
export { getNamehash, getLabelHash, getResolverAddress, getDeployments } from "./utils";
export { verify } from "./verify";
export { nameContract } from "./name";

// Subname commands for oikonomos.eth
export {
  subnameAvailable,
  subnameRegister,
  subnameInfo,
  subnameList,
  type SubnameAvailableOptions,
  type SubnameRegisterOptions,
  type SubnameInfoOptions,
  type SubnameListOptions,
} from "./subname";


