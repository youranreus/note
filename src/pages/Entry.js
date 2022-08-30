/**
 * @author 季悠然
 * @date 2021-12-10
 */
import { useEffect, useState } from "react";
import {
	Toast,
	Empty,
	Button,
	Input,
	Collapsible,
	RadioGroup,
	Radio,
	Typography,
	InputGroup,
	Select,
	AutoComplete,
} from "@douyinfe/semi-ui";
import { IconPlus, IconSearch } from "@douyinfe/semi-icons";
import { IllustrationNoContent } from "@douyinfe/semi-illustrations";
import { useHistory } from "react-router-dom";
import { randomString } from "../utils";
import QuickBar from "../components/QuickBar";
import { GetNote } from "../api/note";

function Entry() {
	const { Title, Paragraph } = Typography;
	const [jumpId, setJumpId] = useState("");
	const [jumpMode, setJumpMode] = useState("local");
	const [localArr, setLocalArr] = useState([]);
	const [onlineArr, setOnlineArr] = useState([]);
	const [localHis, setLocalHis] = useState([]);
	const [onlineHis, setOnlineHis] = useState([]);
	const [addFlag, setAddFlag] = useState(false);
	const [findFlag, setFindFlag] = useState(false);
	const his = useHistory();
	const [newNote, setNewNote] = useState({
		mode: "online",
		key: "",
		lock: "",
	});

	useEffect(() => {
		if (localStorage.getItem("localArr") === null)
			localStorage.setItem("localArr", "");
		if (localStorage.getItem("onlineArr") === null)
			localStorage.setItem("onlineArr", "");
		setLocalArr(
			localStorage
				.getItem("localArr")
				.split(",")
				.filter((item) => item !== "")
		);
		setOnlineArr(
			localStorage
				.getItem("onlineArr")
				.split(",")
				.filter((item) => item !== "")
		);
		setLocalHis(
			localStorage
				.getItem("localArr")
				.split(",")
				.filter((item) => item !== "")
				.reverse()
		);
		setOnlineHis(
			localStorage
				.getItem("onlineArr")
				.split(",")
				.filter((item) => item !== "")
				.reverse()
		);
		// console.log('made with ❤️ by youranreus')
	}, []);

	const switchMode = (e) => {
		setNewNote({
			mode: e.target.value,
			lock: newNote.lock,
			key: newNote.key,
		});
	};

	const jump = () => {
		if (jumpId === "") Toast.warning({ content: "ID呐？" });
		else {
			if (jumpMode === "local") his.push("/l/" + jumpId);
			else his.push("/o/" + jumpId);
		}
	};

	const add = () => {
		if (newNote.mode === "local") addLocal();
		else addOnline();
	};

	const addOnline = () => {
		let onlineData = [].concat(onlineArr);

		//生成新便签id
		let newNoteId = randomString(7);
		GetNote(newNoteId, newNote.key).then((data) => {
			if (data.data.msg) Toast.error(data.data.msg);
			else {
				onlineData.push(newNoteId);
				setOnlineArr(onlineData);
				//更新便签localStorage储存
				localStorage.setItem("onlineArr", onlineData.join(","));
				his.push("/o/" + newNoteId);
			}
		});
	};

	const addLocal = () => {
		//获取当前本地便签清单
		let localData = [].concat(localArr);

		//生成新便签id并添加进入本地便签清单
		let newNoteId = randomString(5);
		localData.push(newNoteId);

		setLocalArr(localData);

		//更新便签localStorage储存
		localStorage.setItem("localArr", localData.join(","));
		localStorage.setItem(newNoteId, "Begin your story");
		his.push("/l/" + newNoteId);
	};

	return (
		<div className="entry">
			<Empty
				image={<IllustrationNoContent style={{ width: 150, height: 150 }} />}
				title="季悠然の便签本"
			>
				<div style={{ textAlign: "center" }}>
					<Button
						icon={<IconPlus />}
						style={{ margin: 12 }}
						theme="solid"
						type="primary"
						onClick={() => {
							setAddFlag(!addFlag);
							setFindFlag(false);
						}}
					>
						撕一张
					</Button>
					<Button
						icon={<IconSearch />}
						style={{ margin: 12 }}
						type="primary"
						onClick={() => {
							setAddFlag(false);
							setFindFlag(!findFlag);
						}}
					>
						找一张
					</Button>
					<br />
					<Collapsible isOpen={findFlag}>
						<div
							onKeyDown={(e) => {
								if (e.keyCode === 13) jump();
							}}
						>
							<InputGroup>
								<Select
									defaultValue="local"
									onSelect={(value) => {
										setJumpMode(value);
									}}
								>
									<Select.Option value="online">在线</Select.Option>
									<Select.Option value="local">本地</Select.Option>
								</Select>
								<AutoComplete
									data={jumpMode === "local" ? localArr : onlineArr}
									placeholder={"便签ID"}
									emptyContent={
										<Paragraph style={{ padding: "6px 12px" }}>
											没有记录噢
										</Paragraph>
									}
									onChange={(v) => {
										setJumpId(v);
									}}
								/>
							</InputGroup>
							<div style={{ textAlign: "right", marginTop: "1rem" }}>
								<Button type={"primary"} onClick={jump}>
									找一下
								</Button>
							</div>
						</div>
					</Collapsible>
					<Collapsible isOpen={addFlag}>
						<div className={"addNote"}>
							<Title heading={6} style={{ margin: "0 0 .5rem" }}>
								标签类型
							</Title>
							<RadioGroup defaultValue={"online"} onChange={switchMode}>
								<Radio value={"local"}>本地便签</Radio>
								<Radio value={"online"}>在线便签</Radio>
							</RadioGroup>
							<Collapsible isOpen={newNote.mode === "online"}>
								<Title heading={6} style={{ margin: "1rem 0 .5rem" }}>
									加密
								</Title>
								<Input
									placeholder={"密钥（留空则无加密）"}
									value={newNote.key}
									onChange={(v) => {
										setNewNote({
											key: v,
											mode: "online",
											lock: newNote.lock,
										});
									}}
								/>
							</Collapsible>
							<div style={{ textAlign: "right", marginTop: "1rem" }}>
								<Button type={"primary"} onClick={add}>
									撕一张
								</Button>
							</div>
						</div>
					</Collapsible>
				</div>
				<QuickBar onlineHis={onlineHis} localHis={localHis} />
			</Empty>
		</div>
	);
}

export default Entry;
